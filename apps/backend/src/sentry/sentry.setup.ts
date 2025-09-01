import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'development',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.1,
      profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
        : 0.1,
      beforeSend(event, hint) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Event:', event, hint);
        }
        return event;
      },
    });
  }
}