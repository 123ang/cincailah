import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export type DecisionFilters = {
  budgetFilter?: 'kering' | 'ok' | 'belanja';
  selectedTags?: string[];
  walkTimeMax?: number;
  halal?: boolean;
  vegOptions?: boolean;
  favoritesOnly?: boolean;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
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
    selectedTags = [],
    walkTimeMax,
    halal,
    vegOptions,
    favoritesOnly,
    maxDistanceKm,
    userLat,
    userLng,
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

  if (walkTimeMax) {
    query.walkMinutes = { lte: Number(walkTimeMax) };
  }

  if (halal) query.halal = true;
  if (vegOptions) query.vegOptions = true;

  let candidates = await prisma.restaurant.findMany({ where: query });

  if (selectedTags.length > 0) {
    candidates = candidates.filter((r) => {
      const allTags = [
        ...(Array.isArray(r.cuisineTags) ? r.cuisineTags : []),
        ...(Array.isArray(r.vibeTags) ? r.vibeTags : []),
      ];
      return selectedTags.some((tag: string) => allTags.includes(tag as never));
    });
  }

  if (favoritesOnly) {
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId },
      select: { restaurantId: true },
    });
    const favIds = new Set(userFavorites.map((f) => f.restaurantId));
    candidates = candidates.filter((r) => favIds.has(r.id));
  }

  if (maxDistanceKm && typeof userLat === 'number' && typeof userLng === 'number') {
    candidates = candidates.filter((r) => {
      if (r.latitude == null || r.longitude == null) return false;
      return haversineKm(userLat, userLng, r.latitude, r.longitude) <= maxDistanceKm;
    });
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
