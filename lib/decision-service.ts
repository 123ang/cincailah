import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type DecisionFilters = {
  budgetFilter?: 'kering' | 'ok' | 'belanja';
  cuisineTags?: string[];
  vibeTags?: string[];
  selectedTags?: string[];
  halal?: boolean;
  vegOptions?: boolean;
  favoritesOnly?: boolean;
  /** Skip anti-repeat filter; reroll may land on the same restaurant. */
  allowRepeatPicks?: boolean;
};

export async function getEligibleRestaurants({
  groupId,
  userId,
  filters,
}: {
  groupId: string;
  userId: string;
  filters?: DecisionFilters;
}) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return { group: null, candidates: [] };

  const query: Prisma.RestaurantWhereInput = {
    groupId,
    isActive: true,
  };

  const {
    budgetFilter,
    cuisineTags = [],
    vibeTags = [],
    selectedTags = [],
    halal,
    vegOptions,
    favoritesOnly,
    allowRepeatPicks,
  } = filters || {};

  if (budgetFilter === 'kering') {
    query.priceMax = { lte: 10 };
  } else if (budgetFilter === 'ok') {
    query.priceMin = { gte: 10 };
    query.priceMax = { lte: 20 };
  } else if (budgetFilter === 'belanja') {
    query.priceMin = { gte: 20 };
  }

  if (halal) query.halal = true;
  if (vegOptions) query.vegOptions = true;

  let candidates = await prisma.restaurant.findMany({ where: query });

  const selectedCuisineTags = cuisineTags.length > 0
    ? cuisineTags
    : selectedTags.filter((tag) =>
        candidates.some((r) => Array.isArray(r.cuisineTags) && (r.cuisineTags as string[]).includes(tag))
      );
  const selectedVibeTags = vibeTags.length > 0
    ? vibeTags
    : selectedTags.filter((tag) =>
        candidates.some((r) => Array.isArray(r.vibeTags) && (r.vibeTags as string[]).includes(tag))
      );

  if (selectedCuisineTags.length > 0) {
    candidates = candidates.filter(
      (r) =>
        Array.isArray(r.cuisineTags) &&
        selectedCuisineTags.some((tag) => (r.cuisineTags as string[]).includes(tag))
    );
  }

  if (selectedVibeTags.length > 0) {
    candidates = candidates.filter(
      (r) =>
        Array.isArray(r.vibeTags) &&
        selectedVibeTags.some((tag) => (r.vibeTags as string[]).includes(tag))
    );
  }

  if (favoritesOnly) {
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId },
      select: { restaurantId: true },
    });
    const favIds = new Set(userFavorites.map((f) => f.restaurantId));
    candidates = candidates.filter((r) => favIds.has(r.id));
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - group.noRepeatDays);

  const recentDecisions = await prisma.lunchDecision.findMany({
    where: {
      groupId,
      decisionDate: { gte: cutoffDate },
    },
    select: { chosenRestaurantId: true },
  });

  const recentRestaurantIds = recentDecisions
    .map((d) => d.chosenRestaurantId)
    .filter((id): id is string => id !== null);

  if (!allowRepeatPicks) {
    candidates = candidates.filter((r) => !recentRestaurantIds.includes(r.id));
  }

  return { group, candidates };
}
