/**
 * Detect Next.js "production build" phase.
 *
 * During `next build`, Next sets NODE_ENV=production while it imports route
 * modules to collect static data. That is *not* the same as a running prod
 * server, and we should not hard-fail on missing secrets at import time.
 *
 * Heuristic: Next sets `NEXT_PHASE` to `phase-production-build` while building.
 * @see https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/constants.ts
 */
export function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
