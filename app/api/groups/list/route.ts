import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { reportError } from '@/lib/logger';

// GET /api/groups/list — list all groups the logged-in user belongs to
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
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
    reportError(error, { route: 'groups/list' });
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
