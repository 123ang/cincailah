import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { verifyPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { LoginSchema, zodError } from '@/lib/schemas';
import { logRequest, reportError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logRequest(request);
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, 5);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again in a minute.' },
      { status: 429 }
    );
  }

  try {
    const raw = await request.json();
    const parsed = LoginSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { email, password } = parsed.data;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Find user's most recent group
    const recentMembership = await prisma.groupMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      include: { group: true },
    });

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.displayName = user.displayName;
    session.isLoggedIn = true;
    
    // Set activeGroupId if user has groups
    if (recentMembership) {
      session.activeGroupId = recentMembership.groupId;
    }
    
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      hasGroups: !!recentMembership,
      activeGroupId: recentMembership?.groupId,
    });
  } catch (error) {
    reportError(error, { route: 'auth/login' });
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
