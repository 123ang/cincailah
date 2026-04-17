/**
 * Structured request + error logger using Pino.
 * In development: pretty-print. In production: JSON to stdout (pipe to your log aggregator).
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
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname', translateTime: 'SYS:HH:MM:ss' },
    },
  }),
});

/** Log an incoming API request. Call at the top of route handlers. */
export function logRequest(req: Request, extra?: Record<string, unknown>) {
  const url = new URL(req.url);
  logger.info({ method: req.method, path: url.pathname, ...extra }, 'api request');
}

export function reportError(err: unknown, context?: Record<string, unknown>) {
  logger.error({ err, ...context }, 'app error');
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  }
}
