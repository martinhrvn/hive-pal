import { defineConfig, devices } from '@playwright/test';

/**
 * Component tests run against the story gallery (playwright/gallery/),
 * served by its own Vite server (vite.gallery.config.ts) — see
 * https://playwright.dev/docs/test-components
 */
export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.tsx',
  testIgnore: ['**/*.spec.ts', '**/*.test.{ts,tsx}', 'node_modules'],
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: './__snapshots__',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    testIdAttribute: 'data-test',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The mount fixture navigates to baseURL, so it must point at the gallery.
        baseURL: 'http://localhost:3100/playwright/gallery/index.html',
        // Keep the app's own service worker from serving cached responses
        // that would shadow page.route() mocks.
        serviceWorkers: 'block',
        // Reuse the browser context between tests in a worker (large speedup).
        reuseContext: true,
      },
    },
  ],

  webServer: {
    command: 'pnpm exec vite --config vite.gallery.config.ts',
    url: 'http://localhost:3100/playwright/gallery/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
