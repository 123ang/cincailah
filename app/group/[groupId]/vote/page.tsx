import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VotePageClient from '@/components/VotePageClient';

export default async function VotePage({
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

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    redirect('/');
  }

  return (
    <VotePageClient
      groupId={groupId}
      userId={session.userId}
      displayName={session.displayName || 'User'}
      filters={filters}
    />
  );
}
