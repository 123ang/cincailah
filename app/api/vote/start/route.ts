import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';
import { requireGroupMembership } from '@/lib/group-access';
import { getEligibleRestaurants } from '@/lib/decision-service';
import { StartVoteSchema, zodError } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = StartVoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { groupId, filters } = parsed.data;

    const membership = await requireGroupMembership(session.userId, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { group, candidates } = await getEligibleRestaurants({
      groupId,
      userId: session.userId,
      filters,
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 3. Check if we have candidates
    if (candidates.length < 3) {
      return NextResponse.json(
        {
          error: 'Need at least 3 restaurants to start voting. Add more or relax filters.',
        },
        { status: 400 }
      );
    }

    // 4. Pick 3-5 random candidates
    const numOptions = Math.min(candidates.length, Math.max(3, Math.min(5, candidates.length)));
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const selectedCandidates = shuffled.slice(0, numOptions);

    // 5. Create lunch decision record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute vote window

    const decision = await prisma.lunchDecision.create({
      data: {
        groupId,
        decisionDate: new Date(),
        modeUsed: 'we_fight',
        constraintsUsed: (filters || {}) as any,
        createdBy: session.userId,
      },
    });

    // 6. Create decision options
    const decisionOptions = await Promise.all(
      selectedCandidates.map((candidate) =>
        prisma.decisionOption.create({
          data: {
            decisionId: decision.id,
            restaurantId: candidate.id,
          },
        })
      )
    );

    // 7. Store expiration time in decision (we'll use a JSON field for this)
    await prisma.lunchDecision.update({
      where: { id: decision.id },
      data: {
        constraintsUsed: {
          ...((filters || {}) as any),
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    // 8. Email fallback notification for group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });
    const voteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/group/${groupId}/vote/${decision.id}`;
    await Promise.all(
      members
        .filter((m) => m.user.id !== session.userId)
        .map((m) =>
          sendEmail({
            to: m.user.email,
            subject: `Vote now in ${group.name} 🗳️`,
            html: `<p>Hi ${m.user.displayName},</p><p>A new lunch vote is live in <strong>${group.name}</strong>. Voting closes in 15 minutes.</p><p><a href="${voteUrl}">Vote now</a></p>`,
          })
        )
    );

    void trackEvent(session.userId, 'vote_start', {
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
    console.error('Start vote error:', error);
    return NextResponse.json(
      { error: 'Failed to start vote' },
      { status: 500 }
    );
  }
}
