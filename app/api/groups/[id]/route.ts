import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserIdWithSession } from '@/lib/session';
import { deleteUpload } from '@/lib/upload';
import { UpdateGroupSchema, zodError } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

type Params = { params: Promise<{ id: string }> };

// GET /api/groups/[id] — group details for members
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, restaurants: true } },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      group: {
        ...membership.group,
        role: membership.role,
        memberCount: membership.group._count.members,
        restaurantCount: membership.group._count.restaurants,
        maxReroll: 3,
      },
    });
  } catch (error) {
    reportError(error, { route: 'groups/[id]/get' });
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] — delete group (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the admin can delete this group' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id } });

    if (session && session.activeGroupId === id) {
      session.activeGroupId = undefined;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'groups/[id]/delete' });
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] — rename or update rules (admin only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the admin can edit this group' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = UpdateGroupSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { name, noRepeatDays, maxReroll, decisionModeDefault, coverUrl } = parsed.data;

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

    if (coverUrl !== undefined && group.coverUrl && group.coverUrl !== coverUrl) {
      await deleteUpload(group.coverUrl);
    }

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    reportError(error, { route: 'groups/[id]/patch' });
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
