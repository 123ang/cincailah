/**
 * Structured request + error logger using Pino.
 * Logs JSON to stdout so Next route handlers do not depend on worker transports.
 *
 * Usage in API routes:
 *   import { logger, logRequest } from '@/lib/logger';
 *   logRequest(request);
 *   logger.error({ err }, 'Something went wrong');
 */

import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
});

/** Log an incoming API request. Call at the top of route handlers. */
export function logRequest(req: Request, extra?: Record<string, unknown>) {
  const url = new URL(req.url);
  try {
    logger.info({ method: req.method, path: url.pathname, ...extra }, 'api request');
  } catch {
    // Logging must never break an API route.
  }
}

export function reportError(err: unknown, context?: Record<string, unknown>) {
  try {
    logger.error({ err, ...context }, 'app error');
  } catch {
    // Logging must never hide the original application error.
  }
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  }
}
