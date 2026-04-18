import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import MyGroupsClient from '@/components/MyGroupsClient';

// This page reads cookies (iron-session) and user-specific DB rows — it must never
// be statically prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function MyGroupsPage() {
  try {
    const session = await getSession();

    if (!session?.isLoggedIn || !session?.userId) {
      redirect('/login');
    }

    // Fetch user's groups
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            creator: true,
            _count: {
              select: { members: true, restaurants: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      makanCode: m.group.makanCode,
      isOwner: m.group.createdBy === session.userId,
      role: m.role,
      memberCount: m.group._count.members,
      restaurantCount: m.group._count.restaurants,
      createdAt: m.group.createdAt.toISOString(),
    }));

    return (
      <MyGroupsClient
        groups={groups}
        activeGroupId={session.activeGroupId || null}
        userEmail={session.email || ''}
        displayName={session.displayName || ''}
      />
    );
  } catch (error) {
    console.error('My Groups error:', error);
    redirect('/login?error=session');
  }
}
