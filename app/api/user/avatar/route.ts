import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { deleteUpload } from '@/lib/upload';
import { logRequest, reportError } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  logRequest(request, { endpoint: 'user/avatar' });
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
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

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatarUrl ?? null },
      select: { id: true, avatarUrl: true },
    });

    if (current?.avatarUrl && current.avatarUrl !== avatarUrl) {
      await deleteUpload(current.avatarUrl);
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    reportError(error, { route: 'user/avatar' });
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}
