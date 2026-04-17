import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, filters } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
    }

    // Get group settings
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 1. Get active restaurants with filters (same logic as decide)
    let query: any = {
      groupId,
      isActive: true,
    };

    const { budgetFilter, selectedTags = [], walkTimeMax, halal, vegOptions } = filters || {};

    if (budgetFilter === 'kering') {
      query.priceMax = { lte: 10 };
    } else if (budgetFilter === 'ok') {
      query.priceMin = { gte: 10 };
      query.priceMax = { lte: 20 };
    } else if (budgetFilter === 'belanja') {
      query.priceMin = { gte: 20 };
    }

    if (walkTimeMax) {
      query.walkMinutes = { lte: Number(walkTimeMax) };
    }

    if (halal) {
      query.halal = true;
    }
    if (vegOptions) {
      query.vegOptions = true;
    }

    let candidates = await prisma.restaurant.findMany({
      where: query,
    });

    // Filter by tags
    if (selectedTags.length > 0) {
      candidates = candidates.filter((r) => {
        const allTags = [
          ...(Array.isArray(r.cuisineTags) ? r.cuisineTags : []),
          ...(Array.isArray(r.vibeTags) ? r.vibeTags : []),
        ];
        return selectedTags.some((tag: string) => allTags.includes(tag));
      });
    }

    // 2. Anti-Repeat Protection
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - group.noRepeatDays);

    const recentDecisions = await prisma.lunchDecision.findMany({
      where: {
        groupId,
        decisionDate: {
          gte: cutoffDate,
        },
      },
      select: {
        chosenRestaurantId: true,
      },
    });

    const recentRestaurantIds = recentDecisions
      .map((d) => d.chosenRestaurantId)
      .filter((id): id is string => id !== null);

    candidates = candidates.filter(
      (r) => !recentRestaurantIds.includes(r.id)
    );

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
        constraintsUsed: filters || {},
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
          ...(filters || {}),
          expiresAt: expiresAt.toISOString(),
        },
      },
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
