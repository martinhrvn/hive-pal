import { execFile } from 'node:child_process';
import fs from 'node:fs';
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

/** Pick the provider from GUIDE_VOICE (none | piper). */
export function voiceFromEnv(env = process.env): VoiceProvider {
  switch (env.GUIDE_VOICE) {
    case 'piper':
      if (!env.PIPER_MODEL)
        throw new Error('GUIDE_VOICE=piper needs PIPER_MODEL');
      return new PiperVoice(env.PIPER_MODEL, env.PIPER_BIN);
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
