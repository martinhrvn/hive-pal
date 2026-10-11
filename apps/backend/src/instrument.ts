import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  // Sentry 11 replaced `sendDefaultPii` with per-category switches and made
  // every category default to "collect". userInfo/cookies reproduce what
  // sendDefaultPii: true collected before (IP address, user, cookies); the
  // categories that are new in v11 stay off so assistant prompts, SQL values
  // and local variables never reach Sentry.
  dataCollection: {
    userInfo: true,
    cookies: true,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
console.log(
  'Sentry initialized',
  process.env.SENTRY_DSN ? 'with DSN' : 'without DSN',
);
