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
