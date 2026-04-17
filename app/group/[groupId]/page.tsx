import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DecidePage from '@/components/DecidePage';
import type { Metadata } from 'next';
import { requireGroupMembership } from '@/lib/group-access';

export const metadata: Metadata = { title: 'Decide' };

export default async function GroupHome({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  try {
    const session = await getSession();
    const { groupId } = await params;

    if (!session?.isLoggedIn || !session?.userId) {
      redirect('/login?redirect=' + encodeURIComponent('/group/' + groupId));
    }

    const membership = await requireGroupMembership(session.userId, groupId);
    if (!membership) {
      redirect('/groups?error=forbidden');
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      redirect('/login?error=group_not_found');
    }

    const [recentDecisions, activeRestaurantsCount, userPrefs] = await Promise.all([
      prisma.lunchDecision.findMany({
        where: { groupId },
        include: { chosenRestaurant: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.restaurant.count({ where: { groupId, isActive: true } }),
      prisma.userPreferences.findUnique({ where: { userId: session.userId } }),
    ]);

    return (
      <DecidePage
        groupId={groupId}
        group={group}
        recentDecisions={recentDecisions}
        activeRestaurantsCount={activeRestaurantsCount}
        currentUserId={session.userId}
        displayName={session.displayName || ''}
        userPrefs={userPrefs ?? null}
      />
    );
  } catch (err) {
    console.error('Group home error:', err);
    redirect('/login?error=session');
  }
}
