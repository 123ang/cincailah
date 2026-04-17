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

const JWT_SECRET_RAW = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET_RAW || JWT_SECRET_RAW.length < 32) {
    throw new Error(
      'JWT_SECRET (or SESSION_SECRET fallback) must be set to at least 32 chars in production'
    );
  }
}

// Dev-only fallback — never reached in production because of the throw above.
export const JWT_SECRET =
  JWT_SECRET_RAW && JWT_SECRET_RAW.length >= 32
    ? JWT_SECRET_RAW
    : 'dev-jwt-secret-min-32-chars-do-not-use-in-production';

export const JWT_EXPIRES_IN = '30d';

export interface MobileTokenPayload {
  sub: string;
  email: string;
  displayName: string;
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileTokenPayload;
    if (!decoded?.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}
