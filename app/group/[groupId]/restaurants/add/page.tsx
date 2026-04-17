import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AddRestaurantForm from '@/components/AddRestaurantForm';

export default async function AddRestaurant({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  return <AddRestaurantForm groupId={groupId} />;
}
