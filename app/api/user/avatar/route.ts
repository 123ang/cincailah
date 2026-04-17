import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deleteUpload } from '@/lib/upload';
import { logRequest } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  logRequest(request, { endpoint: 'user/avatar' });
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatarUrl } = await request.json();
    if (avatarUrl !== null && typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid avatarUrl' }, { status: 400 });
    }

    // Only allow our own /uploads/ paths — prevents storing external URLs that
    // could be used for tracking / SSRF.
    if (avatarUrl && !avatarUrl.startsWith('/uploads/avatars/')) {
      return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 });
    }

    // Fetch current avatar to clean up the old file on replace/remove
    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    });

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: avatarUrl ?? null },
      select: { id: true, avatarUrl: true },
    });

    // Best-effort: delete the old file from disk
    if (current?.avatarUrl && current.avatarUrl !== avatarUrl) {
      await deleteUpload(current.avatarUrl);
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Avatar update error:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}
