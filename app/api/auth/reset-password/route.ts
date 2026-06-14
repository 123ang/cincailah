import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, isValidPassword } from '@/lib/auth';
import { reportError } from '@/lib/logger';
import { getClientIp, rateLimit } from '@/lib/ratelimit';
import { ResetPasswordSchema, zodError } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many reset attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const parsed = ResetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { token, password } = parsed.data;

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        tokenVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    reportError(error, { route: 'auth/reset-password' });
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
