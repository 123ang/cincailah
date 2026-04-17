import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ActivityFeedClient from '@/components/ActivityFeedClient';

export const metadata: Metadata = { title: 'Activity Feed' };

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getSession();
  const { groupId } = await params;

  if (!session.isLoggedIn || !session.userId) redirect('/');

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) redirect('/');

  // Fetch recent activity from existing tables (no new schema)
  const [decisions, restaurants, members] = await Promise.all([
    prisma.lunchDecision.findMany({
      where: { groupId },
      include: {
        chosenRestaurant: { select: { id: true, name: true } },
        creator: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.restaurant.findMany({
      where: { groupId },
      include: { creator: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <ActivityFeedClient
      groupId={groupId}
      groupName={group.name}
      decisions={decisions}
      restaurants={restaurants}
      members={members}
    />
  );
}
