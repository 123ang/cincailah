/**
 * Fixed-window rate limiting.
 *
 * Production defaults to PostgreSQL so every process and server instance shares
 * the same counters. Tests and local development use the in-memory store unless
 * RATE_LIMIT_STORE=database is set.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimitStoreMode = 'memory' | 'database';

export function getRateLimitStoreMode(
  env: Record<string, string | undefined> = process.env,
): RateLimitStoreMode {
  if (env.RATE_LIMIT_STORE === 'database') return 'database';
  if (env.NODE_ENV === 'production') return 'database';
  return 'memory';
}

export function resetMemoryRateLimitStoreForTests() {
  store.clear();
}

function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

interface DatabaseRateLimitRow {
  count: number;
  resetAt: Date;
}

async function rateLimitInDatabase(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { prisma } = await import('@/lib/prisma');
  const nextReset = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<DatabaseRateLimitRow[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "reset_at", "updated_at")
    VALUES (${key}, 1, ${nextReset}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= NOW() THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= NOW() THEN ${nextReset}
        ELSE "rate_limit_buckets"."reset_at"
      END,
      "updated_at" = NOW()
    RETURNING "count", "reset_at" AS "resetAt"
  `;
  const row = rows[0];
  if (!row) throw new Error('Rate limit store returned no result');

  return {
    success: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt.getTime(),
  };
}

/**
 * @param key     Unique key, e.g. `login:1.2.3.4`
 * @param limit   Max requests allowed in the window
 * @param windowMs Window size in milliseconds (default: 60 000 = 1 minute)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeWindowMs = Math.max(1, Math.floor(windowMs));

  if (getRateLimitStoreMode() === 'database') {
    return rateLimitInDatabase(key, safeLimit, safeWindowMs);
  }

  return rateLimitInMemory(key, safeLimit, safeWindowMs);
}

export function getClientIp(request: Request): string {
  const trustedProxyHops = Math.max(
    0,
    Number.parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10) || 0
  );
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded && trustedProxyHops > 0) {
    const chain = forwarded
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const clientIndex = Math.max(0, chain.length - trustedProxyHops);
    if (chain[clientIndex]) return chain[clientIndex];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
