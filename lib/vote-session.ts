import { getVoteExpiry } from './vote-resolution';

type LunchDecisionLookup = {
  id: string;
  constraintsUsed: unknown;
};

type VoteSessionPrisma = {
  lunchDecision: {
    findMany(args: object): Promise<LunchDecisionLookup[]>;
  };
};

export async function findActiveGroupVote(
  prisma: VoteSessionPrisma,
  groupId: string,
  now = new Date(),
) {
  const recentVotes = await prisma.lunchDecision.findMany({
    where: {
      groupId,
      modeUsed: 'we_fight',
      chosenRestaurantId: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      constraintsUsed: true,
    },
  });

  return recentVotes.find((vote) => {
    const expiresAt = getVoteExpiry(vote.constraintsUsed);
    return Boolean(expiresAt && expiresAt > now);
  }) ?? null;
}

export function getVoteStartResponse(vote: LunchDecisionLookup) {
  return {
    success: true,
    decisionId: vote.id,
    expiresAt: getVoteExpiry(vote.constraintsUsed)?.toISOString(),
    reused: true,
  };
}
