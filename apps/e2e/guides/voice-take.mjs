// Synthesize a recorded guide's whole voiceover as one take, in a single TTS
// request, instead of one request per line:
//
//   pnpm guides:take hives
//
// Reads the spoken lines from out/guides/<slug>/script.md (a recording or CI
// run writes it) and writes out/guides/<slug>/take-<engine>.wav. The take is cached
// like any other clip. It is not split into lines or used by the recording.
import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Same .env.local handling as playwright.guides.config.ts.
const envLocal = path.join(here, '..', '.env.local');
if (fs.existsSync(envLocal))
  for (const [key, value] of Object.entries(
    parseEnv(fs.readFileSync(envLocal, 'utf8')),
  ))
    if (/^(GUIDE_|GEMINI_|OPENAI_|PIPER_)/.test(key) && !(key in process.env))
      process.env[key] = value;
// A whole guide is minutes of audio; give the request time to finish.
process.env.GUIDE_VOICE_TIMEOUT_MS ??= String(10 * 60_000);

const { voiceFromEnv } = await import('./voice.ts');

/** What the narrator says for each cue: its 🎙 line, else the caption. */
function spokenLines(markdown) {
  const lines = [];
  let chapter = false;
  for (const raw of markdown.split('\n')) {
    let m;
    if ((m = /^## (.*)$/.exec(raw))) {
      lines.push(m[1]);
      chapter = true;
    } else if (chapter && (m = /^_(.*)_$/.exec(raw))) {
      lines[lines.length - 1] += `. ${m[1]}`;
    } else if ((m = /^\*\*\d+:\d\d\*\* (.*)$/.exec(raw))) {
      lines.push(m[1]);
      chapter = false;
    } else if ((m = /^> 🎙 (.*)$/.exec(raw))) {
      lines[lines.length - 1] = m[1];
      chapter = false;
    }
  }
  return lines;
}

const slug = process.argv[2];
if (!slug) {
  console.error('usage: pnpm guides:take <slug>');
  process.exit(1);
}
const dir = path.resolve(here, '../out/guides', slug);
const script = path.join(dir, 'script.md');
if (!fs.existsSync(script)) {
  console.error(
    `No ${path.relative(process.cwd(), script)}: run the guide first.`,
  );
  process.exit(1);
}
const lines = spokenLines(fs.readFileSync(script, 'utf8'));
const text = lines.join('\n\n');
console.log(
  `[voice] ${slug}: ${lines.length} lines, ${text.length} characters`,
);
const voice = voiceFromEnv();
const clip = await voice.synthesize(text, dir, `take-${voice.name}`);
if (!clip) {
  console.error('No voice configured (GUIDE_VOICE).');
  process.exit(1);
}
console.log(
  `[voice] ${path.relative(process.cwd(), clip.file)}: ${(clip.durationMs / 1000).toFixed(1)} s`,
);
