import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.isLoggedIn || !session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
    }

    // Verify user is member of this group
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: session.userId,
        groupId,
      },
    });

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
