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
    const { makanCode } = body;

    if (!makanCode?.trim()) {
      return NextResponse.json(
        { error: 'Makan Code is required' },
        { status: 400 }
      );
    }

    const codeUpper = makanCode.trim().toUpperCase();

    // Find group
    const group = await prisma.group.findUnique({
      where: { makanCode: codeUpper },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid Makan Code. Group not found.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.userId,
        groupId: group.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user as member
    await prisma.groupMember.create({
      data: {
        userId: session.userId,
        groupId: group.id,
        role: 'member',
      },
    });

    // Update session
    session.activeGroupId = group.id;
    await session.save();

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        makanCode: group.makanCode,
      },
    });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}
