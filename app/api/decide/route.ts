import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { DecideSchema, zodError } from '@/lib/schemas';
import { trackEvent } from '@/lib/analytics';
import { requireGroupMembership } from '@/lib/group-access';
import { getEligibleRestaurants } from '@/lib/decision-service';
import { reportError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = DecideSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { groupId, filters, excludeIds } = parsed.data;

    const excludeList: string[] = Array.isArray(excludeIds)
      ? excludeIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const isReroll = excludeList.length > 0;

    const membership = await requireGroupMembership(userId, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { group, candidates: eligibleCandidates } = await getEligibleRestaurants({
      groupId,
      userId: userId,
      filters,
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    let candidates = eligibleCandidates;

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

    // 5. Weighted random selection:
    // - base weight: 1.0
    // - thumbs up: +0.35 each recent positive rating
    // - thumbs down: -0.25 each recent negative rating (floor at 0.2)
    const ratings = await prisma.rating.findMany({
      where: {
        restaurantId: { in: candidates.map((c) => c.id) },
        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60_000) }, // last 60 days
      },
      select: {
        restaurantId: true,
        thumbs: true,
      },
    });

    const scoreMap = new Map<string, { up: number; down: number }>();
    for (const rating of ratings) {
      const s = scoreMap.get(rating.restaurantId) ?? { up: 0, down: 0 };
      if (rating.thumbs === 'up') s.up += 1;
      if (rating.thumbs === 'down') s.down += 1;
      scoreMap.set(rating.restaurantId, s);
    }

    const weighted = candidates.map((candidate) => {
      const score = scoreMap.get(candidate.id) ?? { up: 0, down: 0 };
      const rawWeight = 1 + score.up * 0.35 - score.down * 0.25;
      return { candidate, weight: Math.max(0.2, rawWeight) };
    });

    const totalWeight = weighted.reduce((sum, it) => sum + it.weight, 0);
    let roll = Math.random() * totalWeight;
    let winner = weighted[0].candidate;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) {
        winner = item.candidate;
        break;
      }
    }

    // 6. Save decision — on reroll, overwrite the most-recent decision by
    //    this user in this group within the last 10 minutes so rerolls don't
    //    pollute anti-repeat history.
    let rerollReplaced = false;
    let savedDecisionId: string | null = null;

    if (isReroll) {
      const recent = await prisma.lunchDecision.findFirst({
        where: {
          groupId,
          createdBy: userId,
          modeUsed: 'you_pick',
          createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recent) {
        const updated = await prisma.lunchDecision.update({
          where: { id: recent.id },
          data: {
            chosenRestaurantId: winner.id,
            constraintsUsed: filters || {},
            decisionDate: new Date(),
          },
        });
        rerollReplaced = true;
        savedDecisionId = updated.id;
      }
    }

    if (!rerollReplaced) {
      const created = await prisma.lunchDecision.create({
        data: {
          groupId,
          decisionDate: new Date(),
          modeUsed: 'you_pick',
          chosenRestaurantId: winner.id,
          constraintsUsed: filters || {},
          createdBy: userId,
        },
      });
      savedDecisionId = created.id;
    }

    void trackEvent(userId, isReroll ? 'reroll' : 'spin', {
      groupId,
      decisionId: savedDecisionId,
      candidateCount: candidates.length,
      mode: 'you_pick',
    });

    return NextResponse.json({
      success: true,
      winner,
      decisionId: savedDecisionId,
      candidates: candidates.slice(0, 8),
      maxReroll: group.maxReroll,
      rerollReplaced,
    });
  } catch (error) {
    reportError(error, { route: 'decide' });
    return NextResponse.json(
      { error: 'Failed to make decision' },
      { status: 500 }
    );
  }
}
