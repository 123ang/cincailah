/**
 * POST /api/auth/token
 * Issues a 30-day JWT for mobile clients (React Native / Expo).
 * Mobile cannot easily use iron-session cookies, so this endpoint
 * accepts email+password and returns a signed JWT.
 *
 * Request:  { email, password }
 * Response: { token, expiresIn, user: { id, email, displayName, emailVerified } }
 *
 * Store the token in expo-secure-store on the mobile side and send it as
 * `Authorization: Bearer <token>` on subsequent requests. Verify tokens
 * server-side via `resolveUserId(request)` from `lib/session`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { LoginSchema, zodError } from '@/lib/schemas';
import { logRequest, reportError } from '@/lib/logger';
import { signMobileToken, JWT_EXPIRES_IN } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  logRequest(request, { endpoint: 'auth/token' });

  const ip = getClientIp(request);
  const rl = rateLimit(`token:${ip}`, 5);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in a minute.' },
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
    const emailLower = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signMobileToken(user);

    return NextResponse.json({
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    reportError(error, { route: 'auth/token' });
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
