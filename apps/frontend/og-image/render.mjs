// Renders og-image/template.html to public/og-image.jpg (1200×630).
//
// Usage (from apps/frontend, inside devenv so Chromium has its libraries):
//   devenv shell -- bash -c 'unset LD_LIBRARY_PATH; cd apps/frontend && pnpm og:image'
//
// Pass an output path to render somewhere else, e.g. for previews:
//   node og-image/render.mjs /tmp/og-preview.jpg
import { chromium } from '@playwright/test';
import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const template = resolve(here, 'template.html');
const output = resolve(
  process.argv[2] ?? resolve(here, '../public/og-image.jpg'),
);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(template).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // Fail loudly instead of silently rendering with a fallback font.
  const fontsLoaded = await page.evaluate(() => ({
    bricolage: document.fonts.check('500 62px "Bricolage Grotesque"'),
    manrope: document.fonts.check('600 20px "Manrope"'),
  }));
  const missing = Object.entries(fontsLoaded)
    .filter(([, loaded]) => !loaded)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Fonts failed to load: ${missing.join(', ')}`);
  }

  await page.screenshot({ path: output, type: 'jpeg', quality: 85 });
  const { size } = await stat(output);
  console.log(`Wrote ${output} (${Math.round(size / 1024)} KB)`);
} finally {
  await browser.close();
}
