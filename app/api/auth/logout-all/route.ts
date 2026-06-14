import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserIdWithSession } from '@/lib/session';
import { reportError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    session?.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'auth/logout-all' });
    return NextResponse.json({ error: 'Failed to log out all sessions' }, { status: 500 });
  }
}
