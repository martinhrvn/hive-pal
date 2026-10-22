import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { VoiceClip } from './voice';

const run = promisify(execFile);

/**
 * Mix clips into one track, each delayed to its cue start. Every clip is
 * first normalized to the same loudness: separate TTS requests come back
 * several dB apart, which sounds like the narrator moving around the room.
 * Returns false when there is nothing to mix or ffmpeg is unavailable.
 */
export async function mixNarration(
  clips: { clip: VoiceClip; startMs: number }[],
  out: string,
): Promise<boolean> {
  if (clips.length === 0 || !(await hasFfmpeg())) return false;
  const inputs = clips.flatMap(c => ['-i', c.clip.file]);
  const delays = clips
    .map(
      (c, i) =>
        // loudnorm resamples to 192 kHz; bring it back down before mixing.
        `[${i}]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,adelay=${c.startMs}:all=1[a${i}]`,
    )
    .join(';');
  const labels = clips.map((_, i) => `[a${i}]`).join('');
  await run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex',
    `${delays};${labels}amix=inputs=${clips.length}:normalize=0`,
    out,
  ]);
  return true;
}

let ffmpeg: Promise<boolean> | undefined;
export function hasFfmpeg(): Promise<boolean> {
  ffmpeg ??= run('ffmpeg', ['-version']).then(
    () => true,
    () => false,
  );
  return ffmpeg;
}

/** webm (+ optional narration.wav) → mp4. Skipped when ffmpeg is missing. */
export async function toMp4(
  webm: string,
  mp4: string,
  audio?: string,
): Promise<boolean> {
  if (!(await hasFfmpeg())) return false;
  const audioArgs = audio ? ['-i', audio, '-c:a', 'aac'] : [];
  await run('ffmpeg', [
    '-y',
    '-i',
    webm,
    ...audioArgs,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4,
  ]);
  return true;
}
