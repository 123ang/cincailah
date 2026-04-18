import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureRestaurantAccessible } from '@/lib/group-access';
import AddRestaurantForm from '@/components/AddRestaurantForm';

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ groupId: string; restaurantId: string }>;
}) {
  const session = await getSession();
  const { groupId, restaurantId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  const access = await ensureRestaurantAccessible(restaurantId, session.userId);
  if (!access) {
    notFound();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant || restaurant.groupId !== groupId) {
    notFound();
  }

  return <AddRestaurantForm groupId={groupId} initialRestaurant={restaurant} />;
}
