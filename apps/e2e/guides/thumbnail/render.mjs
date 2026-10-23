// Render a YouTube thumbnail (1280×720 PNG) for a guide from thumbnail.html.
//
//   pnpm guides:thumbnail harvest --title "Honey|harvest" \
//     --sub "From frames to kilos,|hive by hive" --shot 030-point --crop 614,229,692,360
//
// --shot is a screenshot name from out/guides/<slug>/shots/ (or a path to
// any image); --crop x,y,w,h picks the part of it to show, in screenshot
// pixels; leave --shot out for a text-only thumbnail. "|" breaks a line.
// --tilt=-4 rotates the screenshot (negative numbers need the "=").
// Writes out/guides/<slug>/thumbnail.png unless --out says otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const guides = path.resolve(here, '../../out/guides');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    sub: { type: 'string', default: '' },
    shot: { type: 'string' },
    crop: { type: 'string' },
    tilt: { type: 'string' },
    out: { type: 'string' },
  },
});
const [slug] = positionals;
if (!slug || !values.title) {
  console.error(
    'usage: pnpm guides:thumbnail <slug> --title "Line one|line two" [--sub …] [--shot 030-point] [--crop x,y,w,h] [--tilt=-4] [--out file.png]',
  );
  process.exit(1);
}

function shotUrl(shot) {
  const named = path.join(guides, slug, 'shots', `${shot}.png`);
  const file = fs.existsSync(named) ? named : path.resolve(shot);
  if (!fs.existsSync(file))
    throw new Error(`No screenshot ${shot} (looked for ${named})`);
  return pathToFileURL(file).href;
}

const params = new URLSearchParams({ title: values.title, sub: values.sub });
if (values.shot) params.set('shot', shotUrl(values.shot));
if (values.crop) params.set('crop', values.crop);
if (values.tilt) params.set('tilt', values.tilt);
const out = path.resolve(
  values.out ?? path.join(guides, slug, 'thumbnail.png'),
);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const url = pathToFileURL(path.join(here, 'thumbnail.html'));
  url.search = params.toString();
  await page.goto(url.href);
  await page.evaluate(() => window.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  console.log(out);
} finally {
  await browser.close();
}
