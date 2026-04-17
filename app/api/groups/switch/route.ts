import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { requireGroupMembership } from '@/lib/group-access';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.isLoggedIn || !session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const parsed = z.object({ groupId: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid groupId required' }, { status: 400 });
    }

    const { groupId } = parsed.data;

    const membership = await requireGroupMembership(session.userId, groupId);

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Update session
    session.activeGroupId = groupId;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Switch group error:', error);
    return NextResponse.json(
      { error: 'Failed to switch group' },
      { status: 500 }
    );
  }
}
