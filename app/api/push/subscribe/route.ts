import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dhKey = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const authKey = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';

  if (!endpoint || !p256dhKey || !authKey) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.userId,
      endpoint,
      p256dhKey,
      authKey,
    },
    update: {
      userId: session.userId,
      p256dhKey,
      authKey,
    },
  });

  return NextResponse.json({ success: true });
}
