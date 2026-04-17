import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deleteUpload } from '@/lib/upload';

type Params = { params: Promise<{ id: string }> };

// DELETE /api/groups/[id] — delete group (admin only)
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Only the admin can delete this group' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id } });

    // Clear active group from session if it was this group
    if (session.activeGroupId === id) {
      session.activeGroupId = undefined;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] — rename or update rules (admin only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Only the admin can edit this group' }, { status: 403 });
    }

    const body = await request.json();
    const { name, noRepeatDays, maxReroll, decisionModeDefault, coverUrl } = body;

    // coverUrl must point to our own /uploads/ or be null (no external URLs)
    if (coverUrl !== undefined && coverUrl !== null) {
      if (typeof coverUrl !== 'string' || !coverUrl.startsWith('/uploads/group-covers/')) {
        return NextResponse.json({ error: 'Invalid cover path' }, { status: 400 });
      }
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(noRepeatDays !== undefined && { noRepeatDays: Number(noRepeatDays) }),
        ...(maxReroll !== undefined && { maxReroll: Number(maxReroll) }),
        ...(decisionModeDefault !== undefined && { decisionModeDefault }),
        ...(coverUrl !== undefined && { coverUrl }),
      },
    });

    // Clean up old cover file if it was replaced
    if (coverUrl !== undefined && group.coverUrl && group.coverUrl !== coverUrl) {
      await deleteUpload(group.coverUrl);
    }

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
