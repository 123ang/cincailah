import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }).safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
  }

  const endpoint = parsed.data.endpoint;
  const p256dhKey = parsed.data.keys.p256dh;
  const authKey = parsed.data.keys.auth;

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
