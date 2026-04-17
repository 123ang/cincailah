import { NextRequest, NextResponse } from 'next/server';
import { resolveUserIdWithSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/ratelimit';
import { trackEvent } from '@/lib/analytics';
import { JoinGroupSchema, zodError } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const rl = rateLimit(`join:${userId}`, 10);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many join attempts. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const parsed = JoinGroupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const codeUpper = parsed.data.makanCode.trim().toUpperCase();

    const group = await prisma.group.findUnique({
      where: { makanCode: codeUpper },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid Makan Code. Group not found.' },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.groupMember.findFirst({
      where: { userId, groupId: group.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    await prisma.groupMember.create({
      data: { userId, groupId: group.id, role: 'member' },
    });

    if (session) {
      session.activeGroupId = group.id;
      await session.save();
    }

    void trackEvent(userId, 'group_join', {
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
    reportError(error, { route: 'groups/join' });
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}
