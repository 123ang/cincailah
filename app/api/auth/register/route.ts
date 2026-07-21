import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { sendEmail, getWelcomeEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { RegisterSchema, zodError } from '@/lib/schemas';
import { logRequest, reportError } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  logRequest(request);
  const ip = getClientIp(request);
  const rl = await rateLimit(`register:${ip}`, 5);
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

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        displayName: displayName.trim(),
        emailVerified: true,
      },
    });

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.displayName = user.displayName;
    session.tokenVersion = user.tokenVersion;
    session.isLoggedIn = true;
    await session.save();

    // Send welcome email (fire-and-forget)
    const welcomeContent = getWelcomeEmail(user.displayName);
    void sendEmail({
      to: user.email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
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
        emailVerified: true,
      },
    });
  } catch (error) {
    reportError(error, { route: 'auth/register' });
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
