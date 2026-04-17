import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { verifyMobileToken } from '@/lib/mobile-auth';

export interface SessionData {
  userId?: string;
  email?: string;
  displayName?: string;
  activeGroupId?: string;
  isLoggedIn: boolean;
}

// Iron-session requires at least 32 chars. Never allow a weak fallback in production.
const secret = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
  throw new Error('SESSION_SECRET must be set and at least 32 characters in production');
}

const password =
  secret && secret.length >= 32
    ? secret
    : 'dev-secret-min-32-chars-required-for-iron-session';

export const sessionOptions: SessionOptions = {
  password,
  cookieName: 'cincailah_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Resolve the authenticated userId for a request.
 *
 * Accepts both authentication modes:
 *  - Web: iron-session cookie (set by POST /api/auth/login)
 *  - Mobile: `Authorization: Bearer <jwt>` (issued by POST /api/auth/token)
 *
 * Returns `null` when the caller is not authenticated. Use this in every
 * route that must be reachable from both the web and mobile clients.
 */
export async function resolveUserId(request?: Request): Promise<string | null> {
  const authHeader = request?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = verifyMobileToken(token);
    if (payload?.sub) return payload.sub;
  }

  const session = await getSession();
  if (session?.isLoggedIn && session.userId) return session.userId;

  return null;
}

/**
 * Like `resolveUserId` but also returns the iron-session object when the
 * caller authenticated via cookie. Mobile callers get `session: null`.
 *
 * Use this when you need to mutate the session (e.g. login/logout/switch
 * active group) — those routes should stay web-only anyway.
 */
export async function resolveUserIdWithSession(
  request?: Request
): Promise<{ userId: string | null; session: IronSession<SessionData> | null }> {
  const authHeader = request?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = verifyMobileToken(token);
    if (payload?.sub) return { userId: payload.sub, session: null };
  }

  const session = await getSession();
  if (session?.isLoggedIn && session.userId) {
    return { userId: session.userId, session };
  }
  return { userId: null, session: null };
}
