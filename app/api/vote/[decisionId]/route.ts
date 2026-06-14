import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { trackEvent } from '@/lib/analytics';
import { getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { publicVoteUserSelect } from '@/lib/response-shapes';
import { getVoteExpiry } from '@/lib/vote-resolution';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> }
) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await params;

    const access = await getDecisionWithMembership(decisionId, userId);
    if (access === null) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (access === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const decision = await prisma.lunchDecision.findUnique({
      where: { id: decisionId },
      include: {
        decisionOptions: {
          include: {
            restaurant: true,
            votes: {
              include: {
                user: { select: publicVoteUserSelect },
              },
            },
          },
        },
        group: true,
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // Check if expired
    const expiresAt = getVoteExpiry(decision.constraintsUsed);
    const isExpired = expiresAt ? new Date() > expiresAt : false;
    const winner = decision.chosenRestaurantId
      ? decision.decisionOptions.find(
          (option) => option.restaurantId === decision.chosenRestaurantId,
        )?.restaurant ?? null
      : null;

    return NextResponse.json({
      decision,
      expiresAt: expiresAt?.toISOString(),
      isExpired,
      winner,
    });
  } catch (error) {
    reportError(error, { route: 'vote/get' });
    return NextResponse.json(
      { error: 'Failed to get vote' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> }
) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await params;

    const access = await getDecisionWithMembership(decisionId, userId);
    if (access === null) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (access === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { optionId, vote } = body;

    if (!optionId || !vote) {
      return NextResponse.json(
        { error: 'Option ID and vote required' },
        { status: 400 }
      );
    }

    // Check if decision exists and not expired
    const decision = await prisma.lunchDecision.findUnique({
      where: { id: decisionId },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    const expiresAt = getVoteExpiry(decision.constraintsUsed);
    const isExpired = expiresAt ? new Date() > expiresAt : false;

    if (isExpired) {
      return NextResponse.json({ error: 'Voting has ended' }, { status: 400 });
    }

    const option = await prisma.decisionOption.findFirst({
      where: { id: optionId, decisionId },
      select: { id: true },
    });
    if (!option) {
      return NextResponse.json({ error: 'Invalid option for this decision' }, { status: 400 });
    }

    await prisma.vote.deleteMany({
      where: {
        userId,
        decisionOption: { decisionId },
      },
    });

    await prisma.vote.create({
      data: { decisionOptionId: optionId, userId, vote: vote === 'no' ? 'no' : 'yes' },
    });

    void trackEvent(userId, 'vote_cast', { decisionId, optionId, vote });

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'vote/cast' });
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
