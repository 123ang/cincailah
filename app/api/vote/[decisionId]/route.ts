import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { trackEvent } from '@/lib/analytics';
import { getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';

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
                user: true,
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
    const constraints = decision.constraintsUsed as any;
    const expiresAt = constraints?.expiresAt ? new Date(constraints.expiresAt) : null;
    const isExpired = expiresAt ? new Date() > expiresAt : false;

    // Calculate winner if expired
    let winner = null;
    if (isExpired && !decision.chosenRestaurantId) {
      const voteCounts = decision.decisionOptions.map((option) => ({
        optionId: option.id,
        restaurantId: option.restaurantId,
        count: option.votes.filter((v) => v.vote === 'yes').length,
      }));

      const maxVotes = Math.max(...voteCounts.map((v) => v.count));
      const winningOption = voteCounts.find((v) => v.count === maxVotes);

      if (winningOption) {
        await prisma.lunchDecision.update({
          where: { id: decisionId },
          data: {
            chosenRestaurantId: winningOption.restaurantId,
          },
        });
        winner = decision.decisionOptions.find(
          (o) => o.id === winningOption.optionId
        )?.restaurant;
      }
    }

    return NextResponse.json({
      decision,
      expiresAt: expiresAt?.toISOString(),
      isExpired,
      winner: winner || (decision.chosenRestaurantId ? decision.decisionOptions.find(o => o.restaurantId === decision.chosenRestaurantId)?.restaurant : null),
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

    const constraints = decision.constraintsUsed as any;
    const expiresAt = constraints?.expiresAt ? new Date(constraints.expiresAt) : null;
    const isExpired = expiresAt ? new Date() > expiresAt : false;

    if (isExpired) {
      return NextResponse.json({ error: 'Voting has ended' }, { status: 400 });
    }

    await prisma.vote.upsert({
      where: {
        decisionOptionId_userId: {
          decisionOptionId: optionId,
          userId,
        },
      },
      update: { vote },
      create: { decisionOptionId: optionId, userId, vote },
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
