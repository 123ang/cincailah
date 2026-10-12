import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AddRestaurantForm from '@/components/AddRestaurantForm';
import { getGroupAreas } from '@/lib/restaurant-areas';
import { requireGroupMembership } from '@/lib/group-access';

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

  const membership = await requireGroupMembership(session.userId, groupId);
  const areaSuggestions = membership ? await getGroupAreas(groupId) : [];

  return <AddRestaurantForm groupId={groupId} areaSuggestions={areaSuggestions} />;
}
