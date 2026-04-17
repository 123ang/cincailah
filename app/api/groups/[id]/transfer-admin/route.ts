import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { TransferAdminSchema, zodError } from '@/lib/schemas';

type Params = { params: Promise<{ id: string }> };

// POST /api/groups/[id]/transfer-admin — transfer admin role to another member
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Only the current admin can transfer admin role' }, { status: 403 });
    }

    const parsed = TransferAdminSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { newAdminUserId } = parsed.data;

    if (newAdminUserId === session.userId) {
      return NextResponse.json({ error: 'You are already the admin' }, { status: 400 });
    }

    // Verify new admin is a member
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: newAdminUserId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 400 });
    }

    // Transfer: update group creator and update member roles
    await prisma.$transaction([
      prisma.group.update({
        where: { id: groupId },
        data: { createdBy: newAdminUserId },
      }),
      prisma.groupMember.updateMany({
        where: { groupId, userId: newAdminUserId },
        data: { role: 'admin' },
      }),
      prisma.groupMember.updateMany({
        where: { groupId, userId: session.userId },
        data: { role: 'member' },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transfer admin error:', error);
    return NextResponse.json({ error: 'Failed to transfer admin role' }, { status: 500 });
  }
}
