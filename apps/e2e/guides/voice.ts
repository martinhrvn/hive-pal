import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type VoiceClip = { file: string; durationMs: number };

/**
 * Turns caption text into speech. When a provider is configured, every cue
 * holds for max(reading time, clip duration) so video and voice stay in sync,
 * and the clips are mixed into narration.wav at their cue start times.
 */
export interface VoiceProvider {
  readonly name: string;
  /** Synthesize `text` into a WAV file inside `dir`. */
  synthesize(text: string, dir: string, id: string): Promise<VoiceClip | null>;
}

/** Default: no audio, captions only. */
export class NoopVoice implements VoiceProvider {
  readonly name = 'none';
  async synthesize(): Promise<null> {
    return null;
  }
}

/**
 * Local TTS through the Piper CLI (https://github.com/rhasspy/piper).
 * Stub: expects `piper` on PATH and a voice model, e.g.
 *   GUIDE_VOICE=piper PIPER_MODEL=~/voices/en_GB-alba-medium.onnx
 */
export class PiperVoice implements VoiceProvider {
  readonly name = 'piper';

  constructor(
    private readonly model: string,
    private readonly bin = 'piper',
  ) {}

  async synthesize(text: string, dir: string, id: string): Promise<VoiceClip> {
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${id}.wav`);
    const child = execFile(this.bin, [
      '--model',
      this.model,
      '--output_file',
      file,
    ]);
    child.stdin?.end(text);
    await new Promise<void>((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', code =>
        code === 0 ? resolve() : reject(new Error(`piper exited with ${code}`)),
      );
    });
    return { file, durationMs: wavDurationMs(file) };
  }
}

/** Both cloud engines return 16-bit mono PCM at 24 kHz. */
const TTS_SAMPLE_RATE = 24_000;

/**
 * Named narrator presets (GUIDE_VOICE_PROFILE): a tone prompt plus a matching
 * voice per engine. GUIDE_VOICE_STYLE, GEMINI_TTS_VOICE and OPENAI_TTS_VOICE
 * override single parts of the chosen profile.
 */
export const VOICE_PROFILES = {
  /** Default: full guides. */
  narrator: {
    // No tone prompt: Ludo reads best in its own manner.
    style: '',
    gemini: 'Ludo',
    openai: 'coral',
  },
  /** Shorts: one task in about a minute. */
  upbeat: {
    style:
      'An upbeat, energetic presenter of a short social video. Bright and ' +
      'lively, a little quicker than normal speech, with a smile in the voice.',
    gemini: 'Puck',
    openai: 'nova',
  },
  /** An experienced beekeeper explaining their routine. */
  mentor: {
    style:
      'An experienced, down-to-earth beekeeper sharing what they know. ' +
      'Relaxed, confident and reassuring, speaking at a steady, easy pace.',
    gemini: 'Charon',
    openai: 'ash',
  },
} as const;
export type VoiceProfileName = keyof typeof VOICE_PROFILES;

const NARRATOR_STYLE = VOICE_PROFILES.narrator.style;

/**
 * Cloud clips are cached across runs, keyed by engine settings and text.
 * They live in the user's cache directory, not in out/: they cost money and
 * time to make, and are shared by every clone and worktree of the repo.
 * GUIDE_VOICE_CACHE points somewhere else.
 */
export const VOICE_CACHE_DIR =
  process.env.GUIDE_VOICE_CACHE ||
  path.join(
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'),
    'hive-pal',
    'guide-voice',
  );

/** Longest rate-limit wait worth sitting through; longer means a daily cap. */
const MAX_RETRY_WAIT_MS = 2 * 60_000;
const MAX_RETRIES = 10;

/**
 * Requests per minute to stay under (GUIDE_VOICE_RPM). Gemini TTS allows 10
 * even on a paid key; one less leaves room for clock skew.
 */
const REQUESTS_PER_MINUTE = Number(process.env.GUIDE_VOICE_RPM) || 9;
let nextRequestAt = 0;

/** Space requests evenly instead of running into the rate limit. */
async function nextRequestSlot() {
  const wait = nextRequestAt - Date.now();
  nextRequestAt =
    Math.max(Date.now(), nextRequestAt) + 60_000 / REQUESTS_PER_MINUTE;
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
}

/** A failure worth retrying (a 429, an empty reply), and how long to wait. */
class Retryable extends Error {
  constructor(
    message: string,
    readonly retryMs: number,
    readonly reason = 'rate-limited',
  ) {
    super(message);
  }
}

/**
 * Base for HTTP engines that return raw PCM: caches each clip under
 * VOICE_CACHE_DIR so re-recording neither pays nor waits for
 * unchanged lines, writes the WAV header itself, and waits out per-minute
 * rate limits (the Gemini free tier allows 3 TTS requests a minute).
 */
abstract class CloudVoice implements VoiceProvider {
  abstract readonly name: string;
  /** Everything besides the text that changes the audio. */
  protected abstract cacheKey(): unknown[];
  protected abstract fetchPcm(text: string): Promise<Buffer>;

  async synthesize(text: string, dir: string, id: string): Promise<VoiceClip> {
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(VOICE_CACHE_DIR, { recursive: true });
    const key = createHash('sha256')
      .update(JSON.stringify([this.name, ...this.cacheKey(), text]))
      .digest('hex');
    const cached = path.join(VOICE_CACHE_DIR, `${key}.wav`);
    if (!fs.existsSync(cached)) {
      const pcm = await this.fetchWithRetry(text);
      fs.writeFileSync(cached, pcmToWav(pcm, TTS_SAMPLE_RATE));
    }
    const file = path.join(dir, `${id}.wav`);
    fs.copyFileSync(cached, file);
    return { file, durationMs: wavDurationMs(file) };
  }

  private async fetchWithRetry(text: string): Promise<Buffer> {
    for (let attempt = 1; ; attempt++) {
      try {
        await nextRequestSlot();
        return await this.fetchPcm(text);
      } catch (e) {
        if (
          !(e instanceof Retryable) ||
          attempt > MAX_RETRIES ||
          e.retryMs > MAX_RETRY_WAIT_MS
        )
          throw e;
        console.warn(
          `${this.name} TTS: ${e.reason}, retrying in ${Math.ceil(e.retryMs / 1000)} s`,
        );
        await new Promise(r => setTimeout(r, e.retryMs));
      }
    }
  }
}

async function ensureOk(res: Response, engine: string) {
  if (res.ok) return;
  const body = await res.text();
  const message = `${engine} TTS failed (${res.status}): ${body}`;
  if (res.status === 429) throw new Retryable(message, retryMs(res, body));
  throw new Error(message);
}

/** Wait asked for by a 429: Gemini's RetryInfo ("16.1s"), else Retry-After. */
function retryMs(res: Response, body: string): number {
  const delay = /"retryDelay":\s*"([\d.]+)s"/.exec(body)?.[1];
  const header = res.headers.get('retry-after');
  const seconds = Number(delay ?? header ?? 20);
  // A second of slack so the window has really reset.
  return Math.ceil((Number.isFinite(seconds) ? seconds : 20) * 1000) + 1000;
}

/**
 * OpenAI text-to-speech (https://platform.openai.com/docs/guides/text-to-speech).
 *   GUIDE_VOICE=openai OPENAI_API_KEY=sk-...
 *   OPENAI_TTS_MODEL   default gpt-4o-mini-tts
 *   OPENAI_TTS_VOICE   default from GUIDE_VOICE_PROFILE (coral)
 *   GUIDE_VOICE_STYLE  tone prompt (gpt-4o-* models only)
 * Asks for raw PCM: streamed WAV responses can carry a placeholder data size,
 * which breaks wavDurationMs.
 */
export class OpenAIVoice extends CloudVoice {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini-tts',
    private readonly voice: string = VOICE_PROFILES.narrator.openai,
    private readonly style: string = NARRATOR_STYLE,
  ) {
    super();
  }

  protected cacheKey() {
    return [this.model, this.voice, this.style];
  }

  protected async fetchPcm(text: string): Promise<Buffer> {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        voice: this.voice,
        input: text,
        response_format: 'pcm',
        // Only the gpt-4o TTS models take a style prompt.
        ...(this.model.startsWith('gpt-') && this.style
          ? { instructions: this.style }
          : {}),
      }),
    });
    await ensureOk(res, 'OpenAI');
    return Buffer.from(await res.arrayBuffer());
  }
}

/** Bump when the prompt template changes, so cached clips are redone. */
const GEMINI_PROMPT_VERSION = 2;
const GEMINI_SEED = 7;

/**
 * Gemini native TTS (https://ai.google.dev/gemini-api/docs/speech-generation).
 *   GUIDE_VOICE=gemini GEMINI_API_KEY=...
 *   GEMINI_TTS_MODEL   default gemini-3.8-flash-tts
 *   GEMINI_TTS_VOICE   prebuilt voice, default from GUIDE_VOICE_PROFILE (Ludo)
 *   GUIDE_VOICE_STYLE  tone prompt, sent ahead of the text
 */
export class GeminiVoice extends CloudVoice {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-3.8-flash-tts',
    private readonly voice: string = VOICE_PROFILES.narrator.gemini,
    private readonly style: string = NARRATOR_STYLE,
  ) {
    super();
  }

  protected cacheKey() {
    return [this.model, this.voice, GEMINI_PROMPT_VERSION, this.style];
  }

  /**
   * Every line is a separate request, so the prompt tells the model each one
   * belongs to the same session, and a fixed seed keeps a line's take stable.
   */
  private prompt(text: string): string {
    // GUIDE_VOICE_STYLE=none: just the line, in the voice's own manner.
    if (!this.style) return text;
    return [
      '# AUDIO PROFILE',
      this.style,
      '## DIRECTOR’S NOTES',
      'This line is one of many in a single continuous voiceover recorded in ' +
        'one session. Keep exactly the same voice, pitch, pace, energy and ' +
        'microphone distance as every other line. Speak only the transcript.',
      '### TRANSCRIPT',
      text,
    ].join('\n');
  }

  protected async fetchPcm(text: string): Promise<Buffer> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.prompt(text) }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            // temperature makes the TTS models return no audio at all.
            seed: GEMINI_SEED,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voice } },
            },
          },
        }),
      },
    );
    await ensureOk(res, 'Gemini');
    const json = (await res.json()) as {
      candidates?: {
        content?: {
          parts?: { inlineData?: { data: string; mimeType?: string } }[];
        };
      }[];
    };
    const audio = json.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData,
    )?.inlineData;
    const data = audio?.data;
    // Now and then a reply has no audio (finishReason OTHER); asking again helps.
    if (!data)
      throw new Retryable(
        `Gemini TTS returned no audio: ${JSON.stringify(json)}`,
        1000,
        'no audio in the reply',
      );
    const bytes = Buffer.from(data, 'base64');
    // 2.5 sends raw PCM (audio/L16); 3.x sends a whole WAV file.
    return audio?.mimeType === 'audio/wav' ? wavPcm(bytes) : bytes;
  }
}

/** The PCM samples of a 24 kHz 16-bit mono WAV. */
function wavPcm(wav: Buffer): Buffer {
  if (wav.readUInt32LE(24) !== TTS_SAMPLE_RATE || wav.readUInt16LE(34) !== 16)
    throw new Error('Expected 24 kHz 16-bit WAV from the TTS engine');
  let offset = 12;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'data') return wav.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size;
  }
  throw new Error('No data chunk in the WAV from the TTS engine');
}

/** Wrap 16-bit mono little-endian PCM in a WAV header. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function voiceProfile(name = 'narrator') {
  if (!(name in VOICE_PROFILES))
    throw new Error(
      `Unknown GUIDE_VOICE_PROFILE "${name}" (${Object.keys(VOICE_PROFILES).join(' | ')})`,
    );
  return VOICE_PROFILES[name as VoiceProfileName];
}

/**
 * Pick the provider from GUIDE_VOICE (none | piper | openai | gemini) and its
 * voice and tone from GUIDE_VOICE_PROFILE (default narrator).
 */
export function voiceFromEnv(env = process.env): VoiceProvider {
  const profile = voiceProfile(env.GUIDE_VOICE_PROFILE || undefined);
  const style =
    env.GUIDE_VOICE_STYLE === 'none'
      ? ''
      : env.GUIDE_VOICE_STYLE || profile.style;
  switch (env.GUIDE_VOICE) {
    case 'piper':
      if (!env.PIPER_MODEL)
        throw new Error('GUIDE_VOICE=piper needs PIPER_MODEL');
      return new PiperVoice(env.PIPER_MODEL, env.PIPER_BIN);
    case 'openai':
      if (!env.OPENAI_API_KEY)
        throw new Error('GUIDE_VOICE=openai needs OPENAI_API_KEY');
      return new OpenAIVoice(
        env.OPENAI_API_KEY,
        env.OPENAI_TTS_MODEL || undefined,
        env.OPENAI_TTS_VOICE || profile.openai,
        style,
      );
    case 'gemini': {
      const key = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
      if (!key) throw new Error('GUIDE_VOICE=gemini needs GEMINI_API_KEY');
      return new GeminiVoice(
        key,
        env.GEMINI_TTS_MODEL || undefined,
        env.GEMINI_TTS_VOICE || profile.gemini,
        style,
      );
    }
    case undefined:
    case '':
    case 'none':
      return new NoopVoice();
    default:
      throw new Error(`Unknown GUIDE_VOICE "${env.GUIDE_VOICE}"`);
  }
}

/** Duration of a PCM WAV file, read from its header. */
export function wavDurationMs(file: string): number {
  const buf = fs.readFileSync(file);
  const byteRate = buf.readUInt32LE(28);
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'data') return Math.round((size / byteRate) * 1000);
    offset += 8 + size;
  }
  throw new Error(`No data chunk in ${file}`);
}
