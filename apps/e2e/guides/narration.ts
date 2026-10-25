import fs from 'node:fs';
import path from 'node:path';
import type { VoiceClip } from './voice';

export type CueKind = 'chapter' | 'say' | 'point' | 'do';

/** One narrated moment of a guide; times are ms from the start of the video. */
export type Cue = {
  id: string;
  kind: CueKind;
  text: string;
  /** Secondary line, e.g. a chapter's description. */
  detail?: string;
  /** The voiceover, when it says more than the caption. */
  spoken?: string;
  start: number;
  end: number;
  /** Screenshot taken while the cue was on screen, relative to the guide dir. */
  shot?: string;
  /** Synthesized voice clip, positioned at `start` in narration.wav. */
  voice?: VoiceClip;
};

/** Characters per second a viewer comfortably reads in a caption. */
export const READING_CHARS_PER_SECOND = 12;
export const MIN_HOLD_MS = 2500;

/** Estimated time needed to read `text` (at least MIN_HOLD_MS). */
export function readingTimeMs(text: string): number {
  return Math.max(
    MIN_HOLD_MS,
    Math.round((text.length / READING_CHARS_PER_SECOND) * 1000),
  );
}

/** Pause after a voice clip before the next cue starts speaking. */
export const VOICE_BREATH_MS = 400;
/** Shortest hold for a voiced cue: the voice carries it, the caption is a glance. */
const MIN_VOICED_HOLD_MS = 1500;

/**
 * How long a cue stays up unless the guide says otherwise. Voiced, it follows
 * the clip and the caption on screen; estimating from the (longer) voiceover
 * text left seconds of silence after every line. Silent, it is the reading
 * time of what the narrator would have said.
 */
export function defaultHoldMs(
  caption: string,
  detail: string | undefined,
  spoken: string,
  clip: VoiceClip | null,
): number {
  if (!clip) return readingTimeMs(spoken);
  const onScreen = detail ? `${caption} ${detail}` : caption;
  return Math.max(
    MIN_VOICED_HOLD_MS,
    clip.durationMs + VOICE_BREATH_MS,
    Math.round((onScreen.length / READING_CHARS_PER_SECOND) * 1000),
  );
}

/** Longest subtitle on screen at once: two lines of about 42 characters. */
const SUBTITLE_MAX_CHARS = 84;
const SUBTITLE_LINE_CHARS = 42;

/**
 * The narration track of a guide: every chapter/say/point/do emits a cue.
 * It is written out as WebVTT twice: captions.vtt holds the on-screen
 * captions (chapter times for YouTube, translation input), subtitles.vtt what
 * the narrator says. Plus a readable markdown script with a screenshot per cue.
 */
export class Narration {
  readonly cues: Cue[] = [];
  private t0 = Date.now();

  constructor(readonly title: string) {}

  /** Reset the clock; call when the video recording starts. */
  startClock() {
    this.t0 = Date.now();
  }

  now(): number {
    return Date.now() - this.t0;
  }

  begin(kind: CueKind, text: string): Cue {
    const n = this.cues.length + 1;
    const cue: Cue = {
      id: `${String(n).padStart(3, '0')}-${kind}`,
      kind,
      text,
      start: this.now(),
      end: this.now(),
    };
    this.cues.push(cue);
    return cue;
  }

  end(cue: Cue) {
    cue.end = this.now();
  }

  toVtt(): string {
    const body = this.cues
      .map(
        c =>
          `${c.id}\n${vttTime(c.start)} --> ${vttTime(Math.max(c.end, c.start + 500))}\n${c.text}${c.detail ? `\n${c.detail}` : ''}`,
      )
      .join('\n\n');
    return `WEBVTT - ${this.title}\n\n${body}\n`;
  }

  /**
   * What the narrator says, timed to the voice clip (to the cue without a
   * voice), in chunks short enough to read: a long line is split at its
   * sentences and commas, each chunk getting time in proportion to its length.
   */
  toSubtitles(): string {
    const body = this.cues
      .flatMap(c => {
        const end = c.voice
          ? c.start + c.voice.durationMs
          : Math.max(c.end, c.start + 500);
        const chunks = subtitleChunks(c.spoken ?? c.text);
        const chars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        let at = c.start;
        return chunks.map(chunk => {
          const from = at;
          at += Math.round(((end - c.start) * chunk.length) / chars);
          return `${vttTime(from)} --> ${vttTime(at)}\n${wrapLine(chunk)}`;
        });
      })
      .map((cue, i) => `${i + 1}\n${cue}`)
      .join('\n\n');
    return `WEBVTT - ${this.title}\n\n${body}\n`;
  }

  toMarkdown(): string {
    const lines = [`# ${this.title}`, ''];
    for (const c of this.cues) {
      if (c.kind === 'chapter') {
        lines.push(`## ${c.text}`, '');
        if (c.detail) lines.push(`_${c.detail}_`, '');
      } else lines.push(`**${clock(c.start)}** ${c.text}`, '');
      if (c.spoken) lines.push(`> 🎙 ${c.spoken}`, '');
      if (c.shot) lines.push(`![${c.id}](${c.shot})`, '');
    }
    return lines.join('\n');
  }

  write(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'captions.vtt'), this.toVtt());
    fs.writeFileSync(path.join(dir, 'subtitles.vtt'), this.toSubtitles());
    fs.writeFileSync(path.join(dir, 'script.md'), this.toMarkdown());
  }
}

/**
 * Splits a line into readable chunks: whole sentences while they fit, a long
 * sentence at its commas, a long clause at its middle.
 */
export function subtitleChunks(text: string): string[] {
  return pack(pieces(text, /[^.?!…]+[.?!…]*\s*/g), sentence =>
    pack(pieces(sentence, /[^,;:]+[,;:]*\s*/g), splitLong),
  );
}

function pieces(text: string, pattern: RegExp): string[] {
  return text.match(pattern) ?? [text];
}

/** Joins pieces up to SUBTITLE_MAX_CHARS; one too long on its own goes to `split`. */
function pack(parts: string[], split: (part: string) => string[]): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && (current + part).trim().length > SUBTITLE_MAX_CHARS) {
      chunks.push(current.trim());
      current = '';
    }
    current += part;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap(chunk =>
    chunk.length > SUBTITLE_MAX_CHARS ? split(chunk) : [chunk],
  );
}

/** A clause still longer than SUBTITLE_MAX_CHARS splits at its middle space. */
function splitLong(chunk: string): string[] {
  const cut = middleSpace(chunk);
  if (chunk.length <= SUBTITLE_MAX_CHARS || cut < 0) return [chunk];
  return [
    ...splitLong(chunk.slice(0, cut)),
    ...splitLong(chunk.slice(cut + 1)),
  ];
}

/** Two lines when the chunk does not fit on one. */
function wrapLine(chunk: string): string {
  const cut = middleSpace(chunk);
  if (chunk.length <= SUBTITLE_LINE_CHARS || cut < 0) return chunk;
  return `${chunk.slice(0, cut)}\n${chunk.slice(cut + 1)}`;
}

/** Index of the space closest to the middle of `text`, or -1. */
function middleSpace(text: string): number {
  const mid = text.length / 2;
  let best = -1;
  for (let i = text.indexOf(' '); i >= 0; i = text.indexOf(' ', i + 1))
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  return best;
}

function vttTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const milli = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}.${String(milli).padStart(3, '0')}`;
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
