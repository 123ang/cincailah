/**
 * Mobile JWT auth helpers.
 *
 * The mobile app cannot use iron-session cookies, so it authenticates via a
 * signed JWT issued by POST /api/auth/token and sent as `Authorization: Bearer <token>`.
 *
 * Keep this file free of Next.js runtime imports so it can be pulled in from
 * any route handler or utility without circular deps.
 */

import jwt from 'jsonwebtoken';
import { isNextProductionBuild } from '@/lib/next-phase';

export const JWT_EXPIRES_IN = '30d';

const DEV_FALLBACK =
  'dev-jwt-secret-min-32-chars-do-not-use-in-production________________';

export interface MobileTokenPayload {
  sub: string;
  email: string;
  displayName: string;
}

function isProdRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && !isNextProductionBuild();
}

function resolveRawSecret(): string | undefined {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET;
}

function getJwtSecret(): string {
  const raw = resolveRawSecret();

  if (raw && raw.length >= 32) return raw;

  // `next build` imports route modules with NODE_ENV=production — allow missing
  // secrets during that phase only.
  if (isNextProductionBuild()) return DEV_FALLBACK;

  if (isProdRuntime()) {
    throw new Error(
      'JWT_SECRET (or SESSION_SECRET fallback) must be set to at least 32 chars in production'
    );
  }

  return DEV_FALLBACK;
}

export function signMobileToken(user: {
  id: string;
  email: string;
  displayName: string;
}): string {
  const payload: MobileTokenPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as MobileTokenPayload;
    if (!decoded?.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}
