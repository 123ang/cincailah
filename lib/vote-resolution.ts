export interface VoteCount {
  optionId: string;
  restaurantId: string;
  count: number;
}

export function getVoteExpiry(constraints: unknown): Date | null {
  if (!constraints || typeof constraints !== 'object' || Array.isArray(constraints)) {
    return null;
  }

  const expiresAt = (constraints as Record<string, unknown>).expiresAt;
  if (typeof expiresAt !== 'string') return null;

  const expiry = new Date(expiresAt);
  return Number.isNaN(expiry.getTime()) ? null : expiry;
}

export function selectWinningOption(
  voteCounts: VoteCount[],
  random: () => number = Math.random,
): VoteCount | null {
  if (voteCounts.length === 0) return null;

  const maxVotes = Math.max(...voteCounts.map((vote) => vote.count));
  const tiedOptions = voteCounts.filter((vote) => vote.count === maxVotes);
  const index = Math.min(
    tiedOptions.length - 1,
    Math.floor(Math.max(0, random()) * tiedOptions.length),
  );

  return tiedOptions[index] ?? null;
}

/** Restaurant ids that shared the top vote count, when more than one did. */
export function getTiedRestaurantIds(voteCounts: VoteCount[]): string[] {
  if (voteCounts.length < 2) return [];
  const maxVotes = Math.max(...voteCounts.map((vote) => vote.count));
  const tied = voteCounts.filter((vote) => vote.count === maxVotes);
  return tied.length > 1 ? tied.map((vote) => vote.restaurantId) : [];
}

export function getTieBreak(constraints: unknown): string[] {
  if (!constraints || typeof constraints !== 'object' || Array.isArray(constraints)) return [];
  const ids = (constraints as Record<string, unknown>).tiedRestaurantIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

/** The member who started the vote or the group owner may close it early. */
export function canFinalizeVote({
  userId,
  decisionCreatorId,
  groupOwnerId,
}: {
  userId: string;
  decisionCreatorId: string;
  groupOwnerId: string | null | undefined;
}): boolean {
  return userId === decisionCreatorId || (Boolean(groupOwnerId) && userId === groupOwnerId);
}
