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

/**
 * Broader heuristic for "we are building, not serving".
 *
 * Next normally sets `NEXT_PHASE=phase-production-build`, but we also treat
 * `npm run build` as build-like because `npm_lifecycle_event=build` is stable
 * across environments.
 */
export function isBuildLike(): boolean {
  if (isNextProductionBuild()) return true;
  if (process.env.npm_lifecycle_event === 'build') return true;
  return false;
}
