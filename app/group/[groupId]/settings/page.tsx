import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/SettingsPage';

export default async function Settings({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
    },
  });

  if (!group) {
    redirect('/');
  }

  const isAdmin = group.createdBy === session.userId;

  return (
    <SettingsPage
      group={group}
      isAdmin={isAdmin}
      currentUserId={session.userId}
    />
  );
}
