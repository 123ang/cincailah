import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { trackEvent } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> }
) {
  try {
    const { decisionId } = await params;

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
    console.error('Get vote error:', error);
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
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await params;
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

    // Upsert vote (update if exists, create if not)
    const existingVote = await prisma.vote.findUnique({
      where: {
        decisionOptionId_userId: {
          decisionOptionId: optionId,
          userId: session.userId,
        },
      },
    });

    if (existingVote) {
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { vote },
      });
    } else {
      await prisma.vote.create({
        data: {
          decisionOptionId: optionId,
          userId: session.userId,
          vote,
        },
      });
    }

    void trackEvent(session.userId, 'vote_cast', {
      decisionId,
      optionId,
      vote,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
