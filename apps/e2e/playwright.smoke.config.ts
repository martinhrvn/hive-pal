import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite: one happy path per page, run against a deployed preview
 * (or a local `pnpm dev` stack). Every spec file signs up its own user via
 * the API, so files are independent and safe to run in parallel.
 *
 *   BASE_URL        target origin (default http://localhost:5173)
 *   SMOKE_WORKERS   parallel workers (default 2; sign-up is rate limited per IP)
 *   SMOKE_GREP      regex over test titles/tags, e.g. '@journey|@core'
 *
 * See tests/smoke/README.md.
 */
export default defineConfig({
  testDir: './tests/smoke',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: Number(process.env.SMOKE_WORKERS ?? 2),
  retries: process.env.CI ? 1 : 0,
  grep: process.env.SMOKE_GREP ? new RegExp(process.env.SMOKE_GREP) : undefined,
  reporter: process.env.CI
    ? [
        ['list'],
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-GB',
    timezoneId: 'Europe/Prague',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
