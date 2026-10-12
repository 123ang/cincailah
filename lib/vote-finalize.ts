import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getTiedRestaurantIds, getVoteExpiry, selectWinningOption } from '@/lib/vote-resolution';

export type ResolveVoteResult =
  | { status: 'resolved'; winner: Prisma.RestaurantGetPayload<object> | null; tiedRestaurantIds: string[] }
  | { status: 'open' }
  | { status: 'not_found' }
  | { status: 'invalid'; error: string };

/**
 * Picks the winner of a We Fight vote: most votes wins, ties are broken at random
 * (every tied option has the same chance; the group owner gets no extra weight).
 * `closeNow` ends voting immediately (the Finalise button); otherwise the vote
 * must already be past its expiry.
 */
export async function resolveVote(decisionId: string, { closeNow = false } = {}): Promise<ResolveVoteResult> {
  const decision = await prisma.lunchDecision.findUnique({
    where: { id: decisionId },
    include: {
      chosenRestaurant: true,
      decisionOptions: { include: { votes: { select: { vote: true } } } },
    },
  });
  if (!decision) return { status: 'not_found' };

  const constraints = (decision.constraintsUsed ?? {}) as Record<string, unknown>;
  if (decision.chosenRestaurant) {
    const tied = Array.isArray(constraints.tiedRestaurantIds) ? (constraints.tiedRestaurantIds as string[]) : [];
    return { status: 'resolved', winner: decision.chosenRestaurant, tiedRestaurantIds: tied };
  }

  const expiresAt = getVoteExpiry(decision.constraintsUsed);
  if (!expiresAt) return { status: 'invalid', error: 'Vote has no valid expiry' };
  const now = new Date();
  if (!closeNow && now.getTime() <= expiresAt.getTime()) return { status: 'open' };

  const counts = decision.decisionOptions.map((option) => ({
    optionId: option.id,
    restaurantId: option.restaurantId,
    count: option.votes.filter((vote) => vote.vote === 'yes').length,
  }));
  const winningOption = selectWinningOption(counts);
  if (!winningOption) return { status: 'invalid', error: 'Vote has no options' };
  const tiedRestaurantIds = getTiedRestaurantIds(counts);

  await prisma.lunchDecision.updateMany({
    where: { id: decisionId, chosenRestaurantId: null },
    data: {
      chosenRestaurantId: winningOption.restaurantId,
      constraintsUsed: {
        ...constraints,
        ...(closeNow && now < expiresAt ? { expiresAt: now.toISOString(), closedEarly: true } : {}),
        tiedRestaurantIds,
      } as Prisma.InputJsonValue,
    },
  });

  // Another request may have resolved it first; report what was stored.
  const resolved = await prisma.lunchDecision.findUnique({
    where: { id: decisionId },
    select: { chosenRestaurant: true, constraintsUsed: true },
  });
  const stored = (resolved?.constraintsUsed ?? {}) as Record<string, unknown>;
  return {
    status: 'resolved',
    winner: resolved?.chosenRestaurant ?? null,
    tiedRestaurantIds: Array.isArray(stored.tiedRestaurantIds) ? (stored.tiedRestaurantIds as string[]) : [],
  };
}
