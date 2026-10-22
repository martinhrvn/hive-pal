import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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

/** Output frame rate: smooth enough for the spotlight to glide. */
export const VIDEO_FPS = 30;

/**
 * Records screencast frames to disk and encodes them once, at the end.
 *
 * Playwright's own recorder encodes VP8 in real time with its fastest
 * settings, which turns fades and scrolling into blocks, and the mp4 was a
 * second lossy encode on top. Here the browser's JPEGs are kept as they are
 * and become one x264 encode. Writing to disk during the run keeps the CPU
 * free for the page, so animations stay smooth.
 *
 * Chromium only sends a frame when the page changes; each frame is held
 * until the next one, and ffmpeg resamples the result to `VIDEO_FPS`.
 */
export class FrameRecorder {
  private readonly frames: { file: string; at: number }[] = [];
  private readonly t0 = Date.now();

  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  /** Pass to `page.screencast.start({ onFrame })`. */
  readonly onFrame = async (frame: { data: Buffer; timestamp: number }) => {
    const file = path.join(
      this.dir,
      `${String(this.frames.length).padStart(6, '0')}.jpg`,
    );
    this.frames.push({ file, at: frame.timestamp });
    await fs.promises.writeFile(file, frame.data);
  };

  /**
   * Encode frames from recorder creation until `end` (plus optional
   * narration) to `out`, then delete the frames. False when there are no
   * frames or ffmpeg is missing.
   */
  async encode(
    out: string,
    audio?: string,
    end = Date.now(),
  ): Promise<boolean> {
    if (this.frames.length === 0 || !(await hasFfmpeg())) return false;
    // The concat demuxer shows each file for its duration; the last entry is
    // repeated because the demuxer ignores the final duration.
    const lines = ['ffconcat version 1.0'];
    this.frames.forEach((f, i) => {
      const from = i === 0 ? this.t0 : f.at;
      const to = this.frames[i + 1]?.at ?? end;
      if (to <= from) return;
      lines.push(
        `file '${path.basename(f.file)}'`,
        `duration ${(to - from) / 1000}`,
      );
    });
    lines.push(`file '${path.basename(this.frames.at(-1)!.file)}'`);
    const list = path.join(this.dir, 'frames.ffconcat');
    fs.writeFileSync(list, lines.join('\n'));
    const audioArgs = audio ? ['-i', audio] : [];
    await run('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      ...audioArgs,
      // JPEG frames are full-range BT.601; video players expect BT.709.
      '-vf',
      'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-fps_mode',
      'cfr',
      '-r',
      String(VIDEO_FPS),
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '16',
      '-tune',
      'animation',
      '-colorspace',
      'bt709',
      '-color_primaries',
      'bt709',
      '-color_trc',
      'bt709',
      ...(audio ? ['-c:a', 'aac', '-b:a', '192k'] : []),
      '-movflags',
      '+faststart',
      out,
    ]);
    fs.rmSync(this.dir, { recursive: true, force: true });
    return true;
  }
}
