import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

// Voice settings and API keys may live in the git-ignored .env.local. Only
// those are taken: its BASE_URL points test:smoke:local at the local stack and
// must not override the recording default below. The shell wins over the file.
const envLocal = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocal)) {
  const vars = parseEnv(fs.readFileSync(envLocal, 'utf8'));
  for (const [key, value] of Object.entries(vars)) {
    if (/^(GUIDE_|GEMINI_|OPENAI_|PIPER_)/.test(key) && !(key in process.env))
      process.env[key] = value;
  }
}

/**
 * Living guides (`guides/*.guide.ts`): Playwright specs that double as user
 * guides. See guides/README.md.
 *
 *   (default)       headless e2e run: no video, no pauses
 *   GUIDE=1         record video, captions.vtt and script.md to out/guides/
 *   GUIDE_PASSES    viewport passes to record, e.g. "desktop,mobile"
 *   GUIDE_LOCALE    caption + browser locale (default en)
 *   GUIDE_VOICE     voiceover provider: none (default) | piper | openai | gemini
 *   GUIDE_VOICE_PROFILE  narrator (default) | upbeat | mentor
 *   BASE_URL        target origin (default: https://preview.hivepal.app when
 *                   recording, http://localhost:5173 otherwise)
 */
const GUIDE = !!process.env.GUIDE && process.env.GUIDE !== '0';
// Recordings show the deployed preview; test runs check the local stack.
const BASE_URL =
  process.env.BASE_URL ??
  (GUIDE ? 'https://preview.hivepal.app' : 'http://localhost:5173');

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
    baseURL: BASE_URL,
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
