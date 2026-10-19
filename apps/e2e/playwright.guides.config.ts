import { defineConfig, devices } from '@playwright/test';

/**
 * Living guides (`guides/*.guide.ts`): Playwright specs that double as user
 * guides. See guides/README.md.
 *
 *   (default)       headless e2e run: no video, no pauses
 *   GUIDE=1         record video, captions.vtt and script.md to out/guides/
 *   GUIDE_PASSES    viewport passes to record, e.g. "desktop,mobile"
 *   GUIDE_LOCALE    caption + browser locale (default en)
 *   GUIDE_VOICE     voiceover provider: none (default) | piper
 *   BASE_URL        target origin (default http://localhost:5173)
 */
const GUIDE = !!process.env.GUIDE && process.env.GUIDE !== '0';

// Sized for YouTube: the video is recorded at viewport × deviceScaleFactor.
// Headless Chromium only hands the screencast device-pixel frames when the
// scale is set at launch (--force-device-scale-factor); the context's
// deviceScaleFactor alone gives viewport-sized frames.
//   desktop  1280×720 @1.5 → 1920×1080 (16:9)
//   mobile    360×640 @3   → 1080×1920 (9:16, Shorts)
const PASSES = {
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 },
  mobile: {
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
} as const;
type Pass = keyof typeof PASSES;

const passes = (GUIDE ? (process.env.GUIDE_PASSES ?? 'desktop') : 'desktop')
  .split(',')
  .map(p => p.trim() as Pass);

const LOCALES: Record<string, string> = { en: 'en-GB', sk: 'sk-SK' };
const locale = process.env.GUIDE_LOCALE ?? 'en';

export default defineConfig({
  testDir: './guides',
  testMatch: /.*\.guide\.ts/,
  outputDir: 'test-results/guides',
  fullyParallel: !GUIDE,
  forbidOnly: !!process.env.CI,
  // Recording holds every caption for its reading time.
  timeout: GUIDE ? 10 * 60_000 : 90_000,
  expect: { timeout: 10_000 },
  workers: GUIDE ? 1 : Number(process.env.SMOKE_WORKERS ?? 2),
  retries: !GUIDE && process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/guides' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    headless: true,
    // A renamed button should fail fast, not at the test timeout.
    actionTimeout: 15_000,
    trace: GUIDE ? 'off' : 'retain-on-failure',
    screenshot: GUIDE ? 'off' : 'only-on-failure',
    video: 'off',
    locale: LOCALES[locale] ?? locale,
    timezoneId: 'Europe/Prague',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: passes.map(pass => ({
    name: `guides-${pass}`,
    use: {
      ...devices['Desktop Chrome'],
      ...PASSES[pass],
      launchOptions: {
        slowMo: GUIDE ? 120 : 0,
        args: [`--force-device-scale-factor=${PASSES[pass].deviceScaleFactor}`],
      },
    },
  })),
});
