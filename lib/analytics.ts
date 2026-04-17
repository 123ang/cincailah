import { PostHog } from 'posthog-node';
import { logger } from '@/lib/logger';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const key = process.env.POSTHOG_API_KEY;
  if (!key) return null;

  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export async function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  try {
    const ph = getClient();
    if (!ph) return;
    ph.capture({
      distinctId,
      event,
      properties,
    });
  } catch (err) {
    logger.warn({ err, event }, 'analytics track failed');
  }
}

