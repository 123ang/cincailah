import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserIdWithSession } from '@/lib/session';
import { requireGroupMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';

type Params = { params: Promise<{ id: string; userId: string }> };

// DELETE /api/groups/[id]/members/[userId]
// Admin can kick any member; members can remove themselves (leave)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId: requesterId, session } = await resolveUserIdWithSession(request);
    if (!requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, userId: targetUserId } = await params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const requesterMembership = await requireGroupMembership(requesterId, groupId);
    if (!requesterMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetMembership = await requireGroupMembership(targetUserId, groupId);
    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const isAdmin = group.createdBy === requesterId;
    const isSelf = requesterId === targetUserId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'You cannot remove this member' }, { status: 403 });
    }

    if (isSelf && isAdmin) {
      return NextResponse.json(
        { error: 'Admin cannot leave the group. Transfer admin role or delete the group first.' },
        { status: 400 }
      );
    }

    await prisma.groupMember.deleteMany({
      where: { groupId, userId: targetUserId },
    });

    if (isSelf && session?.activeGroupId === groupId) {
      session.activeGroupId = undefined;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'groups/remove-member' });
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
