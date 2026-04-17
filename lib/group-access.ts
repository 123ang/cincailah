import { prisma } from '@/lib/prisma';

export async function requireGroupMembership(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: { userId, groupId },
    select: { id: true, role: true },
  });

  return membership;
}

export async function requireGroupAdmin(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, createdBy: true },
  });

  if (!group) return null;
  if (group.createdBy !== userId) return false;
  return true;
}

export async function getDecisionWithMembership(decisionId: string, userId: string) {
  const decision = await prisma.lunchDecision.findUnique({
    where: { id: decisionId },
    select: { id: true, groupId: true, chosenRestaurantId: true, constraintsUsed: true },
  });

  if (!decision) return null;
  if (!decision.groupId) return decision;

  const membership = await requireGroupMembership(userId, decision.groupId);
  if (!membership) return false;

  return decision;
}

export async function ensureRestaurantAccessible(restaurantId: string, userId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, groupId: true },
  });

  if (!restaurant) return null;

  const membership = await requireGroupMembership(userId, restaurant.groupId);
  if (!membership) return false;

  return restaurant;
}
