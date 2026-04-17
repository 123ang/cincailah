import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/groups/list — list all groups the logged-in user belongs to
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, restaurants: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      makanCode: m.group.makanCode,
      role: m.role,
      memberCount: m.group._count.members,
      restaurantCount: m.group._count.restaurants,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('List groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
