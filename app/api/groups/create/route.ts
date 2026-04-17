import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { trackEvent } from '@/lib/analytics';

function generateMakanCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.isLoggedIn || !session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Generate unique Makan Code
    let makanCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      makanCode = generateMakanCode();
      const existing = await prisma.group.findUnique({
        where: { makanCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique code. Try again.' },
        { status: 500 }
      );
    }

    // Create group and add user as owner
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        makanCode: makanCode!,
        creator: {
          connect: { id: session.userId },
        },
        members: {
          create: {
            userId: session.userId,
            role: 'owner',
          },
        },
      },
    });

    // Update session
    session.activeGroupId = group.id;
    await session.save();

    void trackEvent(session.userId, 'group_create', {
      groupId: group.id,
      makanCode: group.makanCode,
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        makanCode: group.makanCode,
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
