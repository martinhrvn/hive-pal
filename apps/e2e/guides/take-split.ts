// Cut a whole-guide take (one TTS request for every line) back into one clip
// per line. Whisper finds roughly where each line is spoken; each cut then goes
// in the middle of the pause between two lines.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * whisper.cpp (devenv provides `whisper-cli`) and its model, downloaded into
 * the user's cache on first use.
 *   WHISPER_BIN    default whisper-cli
 *   WHISPER_MODEL  default ~/.cache/hive-pal/whisper/ggml-base.en.bin
 */
const WHISPER_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

/** A line of the take: where it was cut, or why it was not. */
export type TakeLine = {
  text: string;
  startMs: number;
  endMs: number;
  /** The clip, 16-bit mono PCM; missing when the line could not be cut cleanly. */
  pcm?: Buffer;
  sampleRate: number;
  problem?: string;
};

type Word = { word: string; from: number; to: number };

/** 10 ms analysis frames. */
const FRAME_MS = 10;
/** Quieter than this RMS (about -40 dBFS) counts as a pause. */
const SILENT_RMS = 300;
/** A pause shorter than this between two lines is too short to cut in. */
const MIN_PAUSE_MS = 100;
/** Whisper's word times are coarse; look this far past them for the pause. */
const SEARCH_SLACK_MS = 400;
/** Audio kept on each side of a line, so its first and last sounds stay whole. */
const PAD_MS = 60;
/** Share of a line's words Whisper must have heard for its cut to be trusted. */
const MIN_HEARD = 0.6;

export async function splitTake(
  wavFile: string,
  lines: string[],
): Promise<TakeLine[]> {
  const { pcm, sampleRate } = readWav(wavFile);
  const heard = await transcribe(wavFile);
  const expected = lines.flatMap((text, line) =>
    words(text).map(word => ({ word, line })),
  );
  const match = align(
    expected.map(e => e.word),
    heard.map(h => h.word),
  );

  // Where Whisper heard each line, and how much of it.
  const spans = lines.map(() => ({ from: Infinity, to: -Infinity, heard: 0 }));
  expected.forEach((e, i) => {
    const j = match[i];
    if (j < 0) return;
    const span = spans[e.line];
    span.from = Math.min(span.from, heard[j].from);
    span.to = Math.max(span.to, heard[j].to);
    if (similar(e.word, heard[j].word)) span.heard++;
  });

  const rms = frameRms(pcm, sampleRate);
  const problems = lines.map((text, i) => {
    const total = words(text).length;
    return spans[i].heard < MIN_HEARD * total
      ? `only ${spans[i].heard} of ${total} words heard`
      : undefined;
  });

  // The pause between each line and the next, as [from, to] in ms.
  const pauses = lines.slice(1).map((_, k) => {
    if (problems[k] || problems[k + 1]) return undefined;
    const pause = longestPause(
      rms,
      spans[k].to - SEARCH_SLACK_MS,
      spans[k + 1].from + SEARCH_SLACK_MS,
    );
    if (pause) return pause;
    problems[k] ??= 'no pause before the next line';
    problems[k + 1] ??= 'no pause after the previous line';
    return undefined;
  });

  const durationMs = (pcm.length / 2 / sampleRate) * 1000;
  return lines.map((text, i) => {
    const before = i > 0 ? pauses[i - 1] : edge(rms, 'start');
    const after = i < pauses.length ? pauses[i] : edge(rms, 'end', durationMs);
    if (problems[i] || !before || !after)
      return {
        text,
        // Nothing heard at all: no position to show.
        startMs: Number.isFinite(spans[i].from) ? spans[i].from : 0,
        endMs: Number.isFinite(spans[i].to) ? spans[i].to : 0,
        sampleRate,
        problem: problems[i] ?? 'next to a line that could not be cut',
      };
    const pad = (p: [number, number]) => Math.min(PAD_MS, (p[1] - p[0]) / 2);
    const startMs = before[1] - pad(before);
    const endMs = after[0] + pad(after);
    const slice = pcm.subarray(
      Math.round((startMs / 1000) * sampleRate) * 2,
      Math.round((endMs / 1000) * sampleRate) * 2,
    );
    return { text, startMs, endMs, pcm: slice, sampleRate };
  });
}

/** Lowercase words without punctuation, as they are compared to Whisper's. */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** The same word, or one Whisper ran together with the next ("hivepal"). */
function similar(a: string, b: string): boolean {
  return a === b || a.startsWith(b) || b.startsWith(a);
}

/**
 * Word-level edit-distance alignment of the script to what Whisper heard.
 * Returns, for every expected word, the index of its heard word or -1.
 */
function align(expected: string[], heard: string[]): number[] {
  const n = expected.length;
  const m = heard.length;
  const cost = (i: number, j: number) =>
    expected[i] === heard[j] ? 0 : similar(expected[i], heard[j]) ? 0.5 : 1;
  const d = Array.from({ length: n + 1 }, (_, i) =>
    Float64Array.from({ length: m + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost(i - 1, j - 1),
      );
  const match = new Array<number>(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (d[i][j] === d[i - 1][j - 1] + cost(i - 1, j - 1)) match[--i] = --j;
    else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  return match;
}

/** Words with their times, from whisper.cpp's JSON output. */
async function transcribe(wavFile: string): Promise<Word[]> {
  const model = await whisperModel();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hive-pal-take-'));
  try {
    // whisper.cpp only reads 16 kHz WAV.
    const input = path.join(tmp, 'take.wav');
    await run('ffmpeg', [
      '-loglevel',
      'error',
      '-i',
      wavFile,
      '-ar',
      '16000',
      '-ac',
      '1',
      input,
    ]);
    const out = path.join(tmp, 'take');
    // -ml 1 -sow: one segment per word.
    await run(
      process.env.WHISPER_BIN || 'whisper-cli',
      ['-m', model, '-f', input, '-ojf', '-of', out, '-ml', '1', '-sow', '-np'],
      { maxBuffer: 1 << 26 },
    );
    const json = JSON.parse(fs.readFileSync(`${out}.json`, 'utf8')) as {
      transcription: { text: string; offsets: { from: number; to: number } }[];
    };
    return json.transcription.flatMap(s =>
      words(s.text).map(word => ({ word, ...s.offsets })),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function whisperModel(): Promise<string> {
  const configured = process.env.WHISPER_MODEL?.replace(
    /^~(?=\/)/,
    os.homedir(),
  );
  if (configured) return configured;
  const file = path.join(
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'),
    'hive-pal',
    'whisper',
    path.basename(WHISPER_MODEL_URL),
  );
  if (fs.existsSync(file)) return file;
  console.log(`[voice] downloading the Whisper model to ${file}`);
  const res = await fetch(WHISPER_MODEL_URL);
  if (!res.ok) throw new Error(`Whisper model download failed (${res.status})`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.part`, Buffer.from(await res.arrayBuffer()));
  fs.renameSync(`${file}.part`, file);
  return file;
}

/** 16-bit mono PCM and its sample rate. */
function readWav(file: string): { pcm: Buffer; sampleRate: number } {
  const wav = fs.readFileSync(file);
  if (wav.readUInt16LE(22) !== 1 || wav.readUInt16LE(34) !== 16)
    throw new Error(`${file}: expected 16-bit mono WAV`);
  const sampleRate = wav.readUInt32LE(24);
  let offset = 12;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'data')
      return { pcm: wav.subarray(offset + 8, offset + 8 + size), sampleRate };
    offset += 8 + size;
  }
  throw new Error(`No data chunk in ${file}`);
}

/** Loudness of every 10 ms frame. */
function frameRms(pcm: Buffer, sampleRate: number): number[] {
  const size = Math.round((sampleRate * FRAME_MS) / 1000);
  const samples = pcm.length / 2;
  const rms: number[] = [];
  for (let start = 0; start + size <= samples; start += size) {
    let sum = 0;
    for (let k = 0; k < size; k++) {
      const v = pcm.readInt16LE((start + k) * 2);
      sum += v * v;
    }
    rms.push(Math.sqrt(sum / size));
  }
  return rms;
}

/** The longest pause between `fromMs` and `toMs`, if one is long enough. */
function longestPause(
  rms: number[],
  fromMs: number,
  toMs: number,
): [number, number] | undefined {
  const a = Math.max(0, Math.floor(fromMs / FRAME_MS));
  const b = Math.min(rms.length, Math.ceil(toMs / FRAME_MS));
  let best: [number, number] | undefined;
  let start = -1;
  for (let f = a; f <= b; f++) {
    const quiet = f < b && rms[f] < SILENT_RMS;
    if (quiet && start < 0) start = f;
    if (quiet || start < 0) continue;
    if (!best || f - start > best[1] - best[0]) best = [start, f];
    start = -1;
  }
  if (!best || (best[1] - best[0]) * FRAME_MS < MIN_PAUSE_MS) return undefined;
  return [best[0] * FRAME_MS, best[1] * FRAME_MS];
}

/** The silence before the first sound or after the last, as a pause. */
function edge(
  rms: number[],
  side: 'start' | 'end',
  durationMs = 0,
): [number, number] {
  if (side === 'start') {
    const first = rms.findIndex(v => v >= SILENT_RMS);
    return [0, Math.max(0, first) * FRAME_MS];
  }
  let last = rms.length;
  while (last > 0 && rms[last - 1] < SILENT_RMS) last--;
  return [last * FRAME_MS, durationMs];
}
