import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { verifyMobileToken } from '@/lib/mobile-auth';
import { isBuildLike } from '@/lib/next-phase';
import { prisma } from '@/lib/prisma';

export interface SessionData {
  userId?: string;
  email?: string;
  displayName?: string;
  activeGroupId?: string;
  tokenVersion?: number;
  isLoggedIn: boolean;
}

const DEV_PASSWORD = 'dev-secret-min-32-chars-required-for-iron-session';

function isProdRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && !isBuildLike();
}

function getIronSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 32) return secret;

  // `next build` imports route modules with NODE_ENV=production — allow missing
  // secrets during that phase only.
  if (isBuildLike()) return DEV_PASSWORD;

  if (isProdRuntime()) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters in production');
  }

  return DEV_PASSWORD;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getIronSessionPassword(),
    cookieName: 'cincailah_session',
    cookieOptions: {
      // Only enforce secure cookies on a real production runtime (HTTPS).
      secure: isProdRuntime(),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());

  if (session.isLoggedIn && session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { tokenVersion: true },
    });
    if (!user || session.tokenVersion !== user.tokenVersion) {
      session.destroy();
    }
  }

  return session;
}

async function resolveMobileUserId(request?: Request): Promise<string | null> {
  const authHeader = request?.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifyMobileToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { tokenVersion: true, emailVerified: true },
  });
  return user?.tokenVersion === payload.tokenVersion && user.emailVerified
    ? payload.sub
    : null;
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
  const mobileUserId = await resolveMobileUserId(request);
  if (mobileUserId) return mobileUserId;

  const session = await getSession();
  if (session?.isLoggedIn && session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    });
    if (user?.emailVerified) return session.userId;
  }

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
  const mobileUserId = await resolveMobileUserId(request);
  if (mobileUserId) return { userId: mobileUserId, session: null };

  const session = await getSession();
  if (session?.isLoggedIn && session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    });
    if (user?.emailVerified) {
      return { userId: session.userId, session };
    }
  }
  return { userId: null, session: null };
}
