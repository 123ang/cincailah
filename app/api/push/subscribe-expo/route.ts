/**
 * POST /api/push/subscribe-expo
 * Registers an Expo push token for the mobile app.
 * Stores it in the PushSubscription table using the token as both
 * endpoint and auth key (web-push fields used for Expo tokens too).
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = z.object({ token: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const { token } = parsed.data;

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: token },
      create: {
        userId: session.userId,
        endpoint: token,
        // Expo tokens don't use p256dh/auth keys — store the token string in both
        p256dhKey: token,
        authKey: token,
      },
      update: {
        userId: session.userId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Failed to save Expo push token');
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}
