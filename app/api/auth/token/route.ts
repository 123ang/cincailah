/**
 * POST /api/auth/token
 * Issues a short-lived JWT for mobile clients (React Native / Expo).
 * Mobile cannot easily use iron-session cookies, so this endpoint
 * accepts email+password and returns a signed JWT.
 *
 * Request:  { email, password }
 * Response: { token, expiresIn, user: { id, email, displayName } }
 *
 * The JWT should be stored in expo-secure-store on the mobile side.
 * Verify tokens in mobile-facing API routes using verifyMobileToken().
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { LoginSchema, zodError } from '@/lib/schemas';
import { logRequest, logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'changeme';
const EXPIRES_IN = '30d';

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

    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });

    logger.info({ userId: user.id }, 'mobile token issued');

    return NextResponse.json({
      token,
      expiresIn: EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'token endpoint error');
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

/** Utility: verify a mobile JWT token — import this in mobile-facing routes */
export function verifyMobileToken(token: string): { sub: string; email: string; displayName: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; displayName: string };
  } catch {
    return null;
  }
}
