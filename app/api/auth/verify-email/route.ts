import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportError } from '@/lib/logger';
import { getClientIp, rateLimit } from '@/lib/ratelimit';
import { VerifyEmailSchema, zodError } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`verify-email:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const parsed = VerifyEmailSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { token } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      return NextResponse.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'auth/verify-email' });
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
