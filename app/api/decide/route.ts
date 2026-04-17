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
    const { groupId, filters, excludeIds } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
    }

    const excludeList: string[] = Array.isArray(excludeIds)
      ? excludeIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const isReroll = excludeList.length > 0;

    // Get group settings
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 1. Get all active restaurants
    let query: any = {
      groupId,
      isActive: true,
    };

    // 2. Apply filters
    const { budgetFilter, selectedTags = [], walkTimeMax, halal, vegOptions } = filters || {};

    // Budget filter
    if (budgetFilter === 'kering') {
      query.priceMax = { lte: 10 };
    } else if (budgetFilter === 'ok') {
      query.priceMin = { gte: 10 };
      query.priceMax = { lte: 20 };
    } else if (budgetFilter === 'belanja') {
      query.priceMin = { gte: 20 };
    }

    // Walk time
    if (walkTimeMax) {
      query.walkMinutes = { lte: Number(walkTimeMax) };
    }

    // Halal/Veg
    if (halal) {
      query.halal = true;
    }
    if (vegOptions) {
      query.vegOptions = true;
    }

    let candidates = await prisma.restaurant.findMany({
      where: query,
    });

    // Filter by tags (cuisine + vibe)
    if (selectedTags.length > 0) {
      candidates = candidates.filter((r) => {
        const allTags = [
          ...(Array.isArray(r.cuisineTags) ? r.cuisineTags : []),
          ...(Array.isArray(r.vibeTags) ? r.vibeTags : []),
        ];
        return selectedTags.some((tag: string) => allTags.includes(tag));
      });
    }

    // 3. Anti-Repeat Protection
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

    // Exclude already-shown winners from this reroll session
    if (excludeList.length > 0) {
      candidates = candidates.filter((r) => !excludeList.includes(r.id));
    }

    // 4. Check if we have candidates
    if (candidates.length === 0) {
      return NextResponse.json(
        {
          error: 'Wah, so picky! No restaurants match your filters. Try relaxing your standards or reset filters.',
        },
        { status: 400 }
      );
    }

    // 5. Random selection
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[randomIndex];

    // 6. Save decision — on reroll, overwrite the most-recent decision by
    //    this user in this group within the last 10 minutes so rerolls don't
    //    pollute anti-repeat history.
    let rerollReplaced = false;
    if (isReroll) {
      const recent = await prisma.lunchDecision.findFirst({
        where: {
          groupId,
          createdBy: session.userId,
          modeUsed: 'you_pick',
          createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recent) {
        await prisma.lunchDecision.update({
          where: { id: recent.id },
          data: {
            chosenRestaurantId: winner.id,
            constraintsUsed: filters || {},
            decisionDate: new Date(),
          },
        });
        rerollReplaced = true;
      }
    }

    if (!rerollReplaced) {
      await prisma.lunchDecision.create({
        data: {
          groupId,
          decisionDate: new Date(),
          modeUsed: 'you_pick',
          chosenRestaurantId: winner.id,
          constraintsUsed: filters || {},
          createdBy: session.userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      winner,
      candidates: candidates.slice(0, 8), // Return up to 8 for the wheel
      maxReroll: group.maxReroll,
      rerollReplaced,
    });
  } catch (error) {
    console.error('Decision error:', error);
    return NextResponse.json(
      { error: 'Failed to make decision' },
      { status: 500 }
    );
  }
}
