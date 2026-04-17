import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import RouletteSpinner from '@/components/RouletteSpinner';

export default async function DecidePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ filters?: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;
  const search = await searchParams;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  const filters = search.filters ? JSON.parse(decodeURIComponent(search.filters)) : {};

  return (
    <RouletteSpinner
      groupId={groupId}
      userId={session.userId}
      filters={filters}
    />
  );
}
