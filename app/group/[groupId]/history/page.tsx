import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import HistoryPage from '@/components/HistoryPage';

export default async function History({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  const decisions = await prisma.lunchDecision.findMany({
    where: { groupId },
    include: {
      chosenRestaurant: true,
      creator: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const totalDecisions = await prisma.lunchDecision.count({
    where: { groupId },
  });

  const restaurantsCount = await prisma.restaurant.count({
    where: { groupId },
  });

  // Calculate most picked restaurants
  const restaurantCounts = await prisma.lunchDecision.groupBy({
    by: ['chosenRestaurantId'],
    where: {
      groupId,
      chosenRestaurantId: { not: null },
    },
    _count: true,
  });

  const topRestaurantIds = restaurantCounts
    .sort((a, b) => b._count - a._count)
    .slice(0, 3)
    .map((r) => r.chosenRestaurantId)
    .filter((id): id is string => id !== null);

  const topRestaurants = await prisma.restaurant.findMany({
    where: {
      id: { in: topRestaurantIds },
    },
  });

  const topRestaurantsWithCounts = topRestaurants.map((r) => ({
    ...r,
    count: restaurantCounts.find((rc) => rc.chosenRestaurantId === r.id)?._count || 0,
  }));

  return (
    <HistoryPage
      decisions={decisions}
      totalDecisions={totalDecisions}
      restaurantsCount={restaurantsCount}
      topRestaurants={topRestaurantsWithCounts}
    />
  );
}
