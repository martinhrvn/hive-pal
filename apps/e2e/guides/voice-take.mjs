// Synthesize a recorded guide's whole voiceover as one take, in a single TTS
// request instead of one per line, and cut it back into lines:
//
//   pnpm guides:take hives
//   pnpm guides:take harvest --audio path/to/take.wav   # split an existing take
//
// First runs the guide as a plain test to collect its lines, exactly as the
// recording will speak them, into out/guides/<slug>/voiceover.json (no TTS,
// no video). The take goes to out/guides/<slug>/take-<engine>.wav. Whisper
// then finds the lines in the take, and each line's clip goes into the voice
// cache as if GUIDE_VOICE had generated it on its own. The next recording
// takes every line from the take; lines that could not be cut cleanly are
// left out and generated one by one as before.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Same .env.local handling as playwright.guides.config.ts.
const envLocal = path.join(here, '..', '.env.local');
if (fs.existsSync(envLocal))
  for (const [key, value] of Object.entries(
    parseEnv(fs.readFileSync(envLocal, 'utf8')),
  ))
    if (
      /^(GUIDE_|GEMINI_|OPENAI_|PIPER_|WHISPER_)/.test(key) &&
      !(key in process.env)
    )
      process.env[key] = value;
// A whole guide is minutes of audio; give the request time to finish.
process.env.GUIDE_VOICE_TIMEOUT_MS ??= String(10 * 60_000);

const { voiceFromEnv } = await import('./voice.ts');
const { splitTake } = await import('./take-split.ts');

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { audio: { type: 'string' } },
});
const slug = positionals[0];
if (!slug) {
  console.error('usage: pnpm guides:take <slug> [--audio <take.wav>]');
  process.exit(1);
}
const dir = path.resolve(here, '../out/guides', slug);
const linesFile = path.join(dir, 'voiceover.json');

console.log(`[voice] collecting the lines of ${slug}`);
fs.rmSync(linesFile, { force: true });
const pass = spawnSync(
  'pnpm',
  ['exec', 'playwright', 'test', '-c', 'playwright.guides.config.ts', slug],
  {
    cwd: path.join(here, '..'),
    env: { ...process.env, GUIDE_PREPARE: 'lines' },
    stdio: 'inherit',
  },
);
if (pass.status !== 0 || !fs.existsSync(linesFile)) {
  console.error(`[voice] the ${slug} guide did not run through; no take.`);
  process.exit(1);
}
const lines = JSON.parse(fs.readFileSync(linesFile, 'utf8'));

const voice = voiceFromEnv();
if (!voice.cache) {
  console.error('No cached voice configured (GUIDE_VOICE).');
  process.exit(1);
}

let take = values.audio && path.resolve(values.audio);
if (!take) {
  const text = lines.join('\n\n');
  console.log(
    `[voice] ${slug}: ${lines.length} lines, ${text.length} characters`,
  );
  const clip = await voice.synthesize(text, dir, `take-${voice.name}`);
  take = clip.file;
  console.log(
    `[voice] ${path.relative(process.cwd(), take)}: ${(clip.durationMs / 1000).toFixed(1)} s`,
  );
}

console.log('[voice] finding the lines with Whisper');
const cut = await splitTake(take, lines);
const labels = [];
let cached = 0;
cut.forEach((line, i) => {
  const n = String(i + 1).padStart(2, '0');
  const at = `${(line.startMs / 1000).toFixed(3)}\t${(line.endMs / 1000).toFixed(3)}`;
  if (line.pcm) {
    voice.cache(line.text, line.pcm, line.sampleRate);
    cached++;
    labels.push(`${at}\t${n} ${line.text}`);
  } else {
    console.log(`[voice]   #${n} not cut (${line.problem}): ${line.text}`);
    labels.push(`${at}\t${n} ✗ ${line.problem}: ${line.text}`);
  }
});
// An Audacity label track over the take, to check the cuts by ear.
const labelsFile = path.join(dir, `take-${voice.name}.txt`);
fs.writeFileSync(labelsFile, `${labels.join('\n')}\n`);
console.log(
  `[voice] ${cached} of ${cut.length} lines cached from the take; labels in ${path.relative(process.cwd(), labelsFile)}`,
);
if (cached < cut.length)
  console.log(
    `[voice] \`pnpm guides:voice ${slug}\` generates the rest one by one before recording.`,
  );
