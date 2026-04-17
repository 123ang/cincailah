import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import RestaurantsPage from '@/components/RestaurantsPage';

export default async function Restaurants({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  const restaurants = await prisma.restaurant.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
  });

  return <RestaurantsPage groupId={groupId} restaurants={restaurants} />;
}
