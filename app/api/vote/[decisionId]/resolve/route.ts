import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { getVoteExpiry, selectWinningOption } from '@/lib/vote-resolution';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> },
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
        chosenRestaurant: true,
        decisionOptions: {
          include: {
            votes: { select: { vote: true } },
          },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    if (decision.chosenRestaurant) {
      return NextResponse.json({ success: true, winner: decision.chosenRestaurant });
    }

    const expiresAt = getVoteExpiry(decision.constraintsUsed);
    if (!expiresAt) {
      return NextResponse.json({ error: 'Vote has no valid expiry' }, { status: 400 });
    }
    if (Date.now() <= expiresAt.getTime()) {
      return NextResponse.json({ error: 'Voting is still open' }, { status: 409 });
    }

    const winningOption = selectWinningOption(
      decision.decisionOptions.map((option) => ({
        optionId: option.id,
        restaurantId: option.restaurantId,
        count: option.votes.filter((vote) => vote.vote === 'yes').length,
      })),
    );
    if (!winningOption) {
      return NextResponse.json({ error: 'Vote has no options' }, { status: 400 });
    }

    await prisma.lunchDecision.updateMany({
      where: { id: decisionId, chosenRestaurantId: null },
      data: { chosenRestaurantId: winningOption.restaurantId },
    });

    const resolved = await prisma.lunchDecision.findUnique({
      where: { id: decisionId },
      select: { chosenRestaurant: true },
    });

    return NextResponse.json({
      success: true,
      winner: resolved?.chosenRestaurant ?? null,
    });
  } catch (error) {
    reportError(error, { route: 'vote/resolve' });
    return NextResponse.json({ error: 'Failed to resolve vote' }, { status: 500 });
  }
}
