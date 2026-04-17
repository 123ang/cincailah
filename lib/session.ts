import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

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
