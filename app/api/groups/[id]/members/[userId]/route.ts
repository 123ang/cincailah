import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

type Params = { params: Promise<{ id: string; userId: string }> };

// DELETE /api/groups/[id]/members/[userId]
// Admin can kick any member; members can remove themselves (leave)
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, userId: targetUserId } = await params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isAdmin = group.createdBy === session.userId;
    const isSelf = session.userId === targetUserId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'You cannot remove this member' }, { status: 403 });
    }

    // Admin cannot leave their own group (must transfer or delete)
    if (isSelf && isAdmin) {
      return NextResponse.json(
        { error: 'Admin cannot leave the group. Transfer admin role or delete the group first.' },
        { status: 400 }
      );
    }

    await prisma.groupMember.deleteMany({
      where: { groupId, userId: targetUserId },
    });

    // If user removed themselves, clear active group from session
    if (isSelf && session.activeGroupId === groupId) {
      session.activeGroupId = undefined;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
