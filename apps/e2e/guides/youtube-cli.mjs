// Regenerate YouTube metadata for a recorded guide without re-recording:
//
//   pnpm guides:metadata harvest
//   pnpm guides:metadata quick-check-mobile
//
// Reads guides/<slug>.youtube.json (without -mobile) and the recording's
// captions.vtt; writes youtube.md and youtube.json next to the video.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { writeYoutube } = await import('./youtube.ts');
const here = path.dirname(fileURLToPath(import.meta.url));

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error('usage: pnpm guides:metadata <slug> [<slug> …]');
  process.exit(1);
}
for (const slug of slugs) {
  const short = slug.endsWith('-mobile');
  const base = slug.replace(/-mobile$/, '');
  const dir = path.resolve(here, '../out/guides', slug);
  const meta = path.join(here, `${base}.youtube.json`);
  if (!fs.existsSync(meta)) {
    console.error(`No ${path.relative(process.cwd(), meta)}: write it first.`);
    process.exitCode = 1;
    continue;
  }
  const warnings = writeYoutube(dir, meta, short);
  console.log(path.join(dir, 'youtube.md'));
  for (const w of warnings) console.warn(`  ! ${w}`);
}
