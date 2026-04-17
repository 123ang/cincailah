import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { sendEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';
import { requireGroupMembership } from '@/lib/group-access';
import { getEligibleRestaurants } from '@/lib/decision-service';
import { StartVoteSchema, zodError } from '@/lib/schemas';
import { reportError, logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = StartVoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { groupId, filters } = parsed.data;

    const membership = await requireGroupMembership(userId, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { group, candidates } = await getEligibleRestaurants({
      groupId,
      userId,
      filters,
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (candidates.length < 3) {
      return NextResponse.json(
        {
          error: 'Need at least 3 restaurants to start voting. Add more or relax filters.',
        },
        { status: 400 }
      );
    }

    const numOptions = Math.min(candidates.length, Math.max(3, Math.min(5, candidates.length)));
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const selectedCandidates = shuffled.slice(0, numOptions);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const decision = await prisma.lunchDecision.create({
      data: {
        groupId,
        decisionDate: new Date(),
        modeUsed: 'we_fight',
        constraintsUsed: {
          ...(filters ?? {}),
          expiresAt: expiresAt.toISOString(),
        },
        createdBy: userId,
      },
    });

    await prisma.decisionOption.createMany({
      data: selectedCandidates.map((candidate) => ({
        decisionId: decision.id,
        restaurantId: candidate.id,
      })),
    });

    // Email fan-out — one failing recipient must not fail the whole request.
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });

    const voteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/group/${groupId}/vote/${decision.id}`;
    const results = await Promise.allSettled(
      members
        .filter((m) => m.user.id !== userId)
        .map((m) =>
          sendEmail({
            to: m.user.email,
            subject: `Vote now in ${group.name} 🗳️`,
            html: `<p>Hi ${m.user.displayName},</p><p>A new lunch vote is live in <strong>${group.name}</strong>. Voting closes in 15 minutes.</p><p><a href="${voteUrl}">Vote now</a></p>`,
          })
        )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      logger.warn({ decisionId: decision.id, failed }, 'vote-start email fan-out partial failure');
    }

    void trackEvent(userId, 'vote_start', {
      groupId,
      decisionId: decision.id,
      optionCount: selectedCandidates.length,
    });

    return NextResponse.json({
      success: true,
      decisionId: decision.id,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    reportError(error, { route: 'vote/start' });
    return NextResponse.json(
      { error: 'Failed to start vote' },
      { status: 500 }
    );
  }
}
