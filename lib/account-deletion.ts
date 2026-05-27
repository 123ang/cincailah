type TransactionClient = {
  group: {
    findMany(args: object): Promise<Array<{ id: string }>>;
    deleteMany(args: object): Promise<unknown>;
  };
  restaurant: {
    findMany(args: object): Promise<Array<{ id: string }>>;
    deleteMany(args: object): Promise<unknown>;
  };
  lunchDecision: {
    findMany(args: object): Promise<Array<{ id: string }>>;
    deleteMany(args: object): Promise<unknown>;
  };
  decisionOption: { deleteMany(args: object): Promise<unknown> };
  vote: { deleteMany(args: object): Promise<unknown> };
  userFavorite: { deleteMany(args: object): Promise<unknown> };
  rating: { deleteMany(args: object): Promise<unknown> };
  comment: { deleteMany(args: object): Promise<unknown> };
  pushSubscription: { deleteMany(args: object): Promise<unknown> };
  userPreferences: { deleteMany(args: object): Promise<unknown> };
  groupMember: { deleteMany(args: object): Promise<unknown> };
  user: { delete(args: object): Promise<unknown> };
};

type PrismaLike = {
  $transaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T>;
};

function ids(rows: Array<{ id: string }>) {
  return rows.map((row) => row.id);
}

export async function deleteUserAccount(prisma: PrismaLike, userId: string) {
  await prisma.$transaction(async (tx) => {
    const ownedGroups = await tx.group.findMany({
      where: { createdBy: userId },
      select: { id: true },
    });
    const ownedGroupIds = ids(ownedGroups);

    const ownedRestaurantsOutsideOwnedGroups = await tx.restaurant.findMany({
      where: {
        createdBy: userId,
        ...(ownedGroupIds.length > 0 && { groupId: { notIn: ownedGroupIds } }),
      },
      select: { id: true },
    });
    const ownedRestaurantIds = ids(ownedRestaurantsOutsideOwnedGroups);

    const ownedDecisionsOutsideOwnedGroups = await tx.lunchDecision.findMany({
      where: {
        createdBy: userId,
        ...(ownedGroupIds.length > 0 && {
          OR: [{ groupId: null }, { groupId: { notIn: ownedGroupIds } }],
        }),
      },
      select: { id: true },
    });
    const ownedDecisionIds = ids(ownedDecisionsOutsideOwnedGroups);

    await tx.vote.deleteMany({ where: { userId } });
    await tx.userFavorite.deleteMany({ where: { userId } });
    await tx.rating.deleteMany({ where: { userId } });
    await tx.comment.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.userPreferences.deleteMany({ where: { userId } });

    const decisionOptionFilters = [
      ownedRestaurantIds.length > 0 ? { restaurantId: { in: ownedRestaurantIds } } : null,
      ownedDecisionIds.length > 0 ? { decisionId: { in: ownedDecisionIds } } : null,
    ].filter(Boolean);

    if (decisionOptionFilters.length > 0) {
      await tx.decisionOption.deleteMany({ where: { OR: decisionOptionFilters } });
    }

    if (ownedRestaurantIds.length > 0) {
      await tx.restaurant.deleteMany({ where: { id: { in: ownedRestaurantIds } } });
    }

    if (ownedDecisionIds.length > 0) {
      await tx.lunchDecision.deleteMany({ where: { id: { in: ownedDecisionIds } } });
    }

    await tx.groupMember.deleteMany({ where: { userId } });

    if (ownedGroupIds.length > 0) {
      await tx.group.deleteMany({ where: { id: { in: ownedGroupIds } } });
    }

    await tx.user.delete({ where: { id: userId } });
  });
}
