import { NextRequest, NextResponse } from 'next/server';
import { resolveUserIdWithSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { trackEvent } from '@/lib/analytics';
import { CreateGroupSchema, zodError } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

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
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const parsed = CreateGroupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { name } = parsed.data;

    let makanCode: string | undefined;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      makanCode = generateMakanCode();
      const existing = await prisma.group.findUnique({
        where: { makanCode },
      });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique || !makanCode) {
      return NextResponse.json(
        { error: 'Failed to generate unique code. Try again.' },
        { status: 500 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        makanCode,
        creator: { connect: { id: userId } },
        members: {
          create: { userId, role: 'owner' },
        },
      },
    });

    // Only web callers have a mutable session to store activeGroupId on.
    if (session) {
      session.activeGroupId = group.id;
      await session.save();
    }

    void trackEvent(userId, 'group_create', {
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
    reportError(error, { route: 'groups/create' });
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
