/**
 * Validates required environment variables at boot.
 * Call this from lib/prisma.ts or a Next.js instrumentation file so it runs once at startup.
 */

import { isBuildLike } from '@/lib/next-phase';

interface EnvSpec {
  key: string;
  required: boolean;
  minLength?: number;
  description: string;
}

const envSpecs: EnvSpec[] = [
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
  },
  {
    key: 'SESSION_SECRET',
    required: true,
    minLength: 32,
    description: 'Iron-session encryption secret (min 32 chars)',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public app URL for email links and QR codes',
  },
  {
    key: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for transactional email (optional in dev)',
  },
  {
    key: 'EMAIL_FROM',
    required: false,
    description: 'From address for transactional email',
  },
  {
    key: 'JWT_SECRET',
    required: false,
    description: 'JWT secret for mobile token auth — falls back to SESSION_SECRET',
  },
  {
    key: 'CRON_SECRET',
    required: false,
    description: 'Shared secret for /api/cron/reminders',
  },
  {
    key: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    required: false,
    description: 'Public VAPID key for browser push subscriptions',
  },
  {
    key: 'VAPID_PRIVATE_KEY',
    required: false,
    description: 'Private VAPID key for sending web push',
  },
  {
    key: 'POSTHOG_API_KEY',
    required: false,
    description: 'PostHog project API key for server-side event tracking',
  },
  {
    key: 'POSTHOG_HOST',
    required: false,
    description: 'PostHog host URL (defaults to https://app.posthog.com)',
  },
  {
    key: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error monitoring',
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    description: 'Public Sentry DSN for browser-side error reporting',
  },
  {
    key: 'SENTRY_ORG',
    required: false,
    description: 'Sentry org slug (optional, used for source map upload)',
  },
  {
    key: 'SENTRY_PROJECT',
    required: false,
    description: 'Sentry project slug (optional, used for source map upload)',
  },
];

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  // `next build` imports server modules with NODE_ENV=production, but that is not a
  // running server — do not hard-fail env validation during the build graph step.
  if (isBuildLike()) return;

  const errors: string[] = [];

  for (const spec of envSpecs) {
    const value = process.env[spec.key];

    if (spec.required && !value) {
      errors.push(`Missing required env var: ${spec.key} — ${spec.description}`);
      continue;
    }

    if (value && spec.minLength && value.length < spec.minLength) {
      errors.push(
        `Env var ${spec.key} is too short (${value.length} chars, need at least ${spec.minLength}) — ${spec.description}`
      );
    }
  }

  if (errors.length > 0) {
    const msg = ['[cincailah] Environment validation failed:', ...errors.map(e => `  ✗ ${e}`)].join('\n');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }
}
