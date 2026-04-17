import { NextRequest, NextResponse } from 'next/server';
import { resolveUserIdWithSession } from '@/lib/session';
import { requireGroupMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const parsed = z.object({ groupId: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid groupId required' }, { status: 400 });
    }

    const { groupId } = parsed.data;

    const membership = await requireGroupMembership(userId, groupId);

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Only web clients have a mutable session — mobile tracks active group client-side.
    if (session) {
      session.activeGroupId = groupId;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'groups/switch' });
    return NextResponse.json({ error: 'Failed to switch group' }, { status: 500 });
  }
}
