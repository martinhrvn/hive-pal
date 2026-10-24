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

/**
 * The narration track of a guide: every chapter/say/point/do emits a cue.
 * It is written out as WebVTT (soft subtitles, input for translation or TTS)
 * and as a readable markdown script with a screenshot per cue.
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
    fs.writeFileSync(path.join(dir, 'script.md'), this.toMarkdown());
  }
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
