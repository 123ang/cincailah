import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hashPassword, generateResetToken } from '@/lib/auth';
import { sendEmail, getWelcomeEmail, getVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { RegisterSchema, zodError } from '@/lib/schemas';
import { logRequest } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  logRequest(request);
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 5);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again in a minute.' },
      { status: 429 }
    );
  }

  try {
    const raw = await request.json();
    const parsed = RegisterSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { email, password, displayName } = parsed.data;
    const emailLower = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const emailVerifyToken = generateResetToken();
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        displayName: displayName.trim(),
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.displayName = user.displayName;
    session.isLoggedIn = true;
    await session.save();

    // Send welcome + verification emails (fire-and-forget)
    const welcomeContent = getWelcomeEmail(user.displayName);
    void sendEmail({
      to: user.email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify/${emailVerifyToken}`;
    const verifyContent = getVerificationEmail(verifyUrl, user.displayName);
    void sendEmail({
      to: user.email,
      subject: verifyContent.subject,
      html: verifyContent.html,
    });

    void trackEvent(user.id, 'signup', {
      source: 'web',
      emailDomain: user.email.split('@')[1] || 'unknown',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
