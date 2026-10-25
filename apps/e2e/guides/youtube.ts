import fs from 'node:fs';
import path from 'node:path';

/**
 * YouTube metadata for a recorded guide: title, description with chapters,
 * tags. The text is written by hand in `<slug>.youtube.json` next to the
 * guide; chapter times come from the recording's captions.vtt, so they always
 * match the video. Written to youtube.md (to copy from) and youtube.json.
 *
 * Kept free of TypeScript-only syntax so `node --experimental-strip-types`
 * can run it from youtube-cli.mjs.
 */

export type GuideMeta = {
  /** Under 100 characters; aim for about 70. */
  title: string;
  /** Two or three plain sentences on what the video covers. */
  summary: string;
  /** Added to DEFAULT_TAGS. */
  tags?: string[];
  /** Up to three, without the #. */
  hashtags?: string[];
  /**
   * YouTube chapters, keyed by the caption that starts them. Cards (intro,
   * chapters, outro) are chapters already, named after their title; map a
   * card's title to rename it, any other caption to add a chapter there, or
   * a caption to null to drop it.
   */
  chapters?: Record<string, string | null>;
};

export const DEFAULT_TAGS = [
  'beekeeping',
  'beekeeping app',
  'hive pal',
  'beehive management',
  'apiary',
  'open source',
];

const LINKS = [
  'Try Hive Pal: https://hivepal.app',
  'Documentation: https://docs.hivepal.app',
  'Source code: https://github.com/martinhrvn/hive-pal',
];

/** A cue from captions.vtt: "001-chapter" + times + caption lines. */
type VttCue = { kind: string; startMs: number; endMs: number; text: string };

export function readVtt(file: string): VttCue[] {
  const blocks = fs.readFileSync(file, 'utf8').split(/\n\n+/);
  const cues: VttCue[] = [];
  for (const block of blocks) {
    const [id, times, first] = block.trim().split('\n');
    const m = /^(\S+) --> (\S+)/.exec(times ?? '');
    if (!m || !first) continue;
    cues.push({
      kind: id.replace(/^\d+-/, ''),
      startMs: vttMs(m[1]),
      endMs: vttMs(m[2]),
      text: first.trim(),
    });
  }
  return cues;
}

function vttMs(t: string): number {
  const [h, m, s] = t.split(':');
  return Math.round(((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000);
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mm = Math.floor(s / 60) % 60;
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
}

type Chapter = { startMs: number; title: string };

/** Chapters from the cards plus the guide's own markers. */
export function chapters(cues: VttCue[], meta: GuideMeta): Chapter[] {
  const marks = meta.chapters ?? {};
  const out: Chapter[] = [];
  for (const cue of cues) {
    const mapped = cue.text in marks ? marks[cue.text] : undefined;
    if (mapped === null) continue;
    const title = mapped ?? (cue.kind === 'chapter' ? cue.text : undefined);
    if (title) out.push({ startMs: cue.startMs, title });
  }
  // YouTube wants the first chapter at 0:00.
  if (out[0]) out[0].startMs = 0;
  return out;
}

/** YouTube's rules for automatic chapters and field limits. */
export function check(
  title: string,
  description: string,
  tags: string[],
  list: Chapter[] | undefined,
  missing: string[],
): string[] {
  const warnings: string[] = [];
  if (title.length > 100)
    warnings.push(`Title is ${title.length} characters; YouTube allows 100.`);
  if (description.length > 5000)
    warnings.push(
      `Description is ${description.length} characters; YouTube allows 5000.`,
    );
  if (tags.join(',').length > 500)
    warnings.push(
      'Tags are over 500 characters together; YouTube will refuse them.',
    );
  for (const text of missing)
    warnings.push(
      `Chapter marker "${text}" matches no caption in this recording.`,
    );
  if (list) {
    if (list.length < 3)
      warnings.push(
        `Only ${list.length} chapters; YouTube needs at least 3 to show them. Add markers in the .youtube.json.`,
      );
    list.forEach((c, i) => {
      const next = list[i + 1];
      if (next && next.startMs - c.startMs < 10_000)
        warnings.push(
          `Chapter "${c.title}" is shorter than 10 s; YouTube needs at least 10 s per chapter.`,
        );
    });
  }
  return warnings;
}

/**
 * Write youtube.md and youtube.json into a recording's folder. `short`
 * (the mobile pass) drops chapters, which Shorts don't show, and tags it
 * #Shorts. Returns the warnings, which are also listed in youtube.md.
 */
export function writeYoutube(
  dir: string,
  metaFile: string,
  short = false,
): string[] {
  if (!fs.existsSync(metaFile))
    return [`No ${path.basename(metaFile)}: skipped YouTube metadata.`];
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')) as GuideMeta;
  const cues = readVtt(path.join(dir, 'captions.vtt'));
  const texts = new Set(cues.map(c => c.text));
  const missing = Object.keys(meta.chapters ?? {}).filter(t => !texts.has(t));
  const list = short ? undefined : chapters(cues, meta);
  const hashtags = [...(meta.hashtags ?? []), ...(short ? ['Shorts'] : [])]
    .map(h => `#${h.replace(/^#/, '')}`)
    .join(' ');
  const description = [
    meta.summary.trim(),
    list &&
      ['Chapters', ...list.map(c => `${clock(c.startMs)} ${c.title}`)].join(
        '\n',
      ),
    LINKS.join('\n'),
    hashtags,
  ]
    .filter(Boolean)
    .join('\n\n');
  const tags = [...new Set([...(meta.tags ?? []), ...DEFAULT_TAGS])];
  const warnings = check(meta.title, description, tags, list, missing);
  const thumbnail = fs.existsSync(path.join(dir, 'thumbnail.png'));

  fs.writeFileSync(
    path.join(dir, 'youtube.json'),
    JSON.stringify({ title: meta.title, description, tags, short }, null, 2) +
      '\n',
  );
  const md = [
    `# ${meta.title}`,
    '',
    '## Title',
    '',
    '```',
    meta.title,
    '```',
    '',
    '## Description',
    '',
    '```',
    description,
    '```',
    '',
    '## Tags',
    '',
    '```',
    tags.join(', '),
    '```',
    '',
    '## Upload',
    '',
    `- Video: \`video.mp4\``,
    `- Thumbnail: ${thumbnail ? '`thumbnail.png`' : 'none yet (`pnpm guides:thumbnail`)'}`,
    '- Subtitles: `subtitles.vtt` (Subtitles → Upload file → With timing)',
    ...(short
      ? []
      : [
          '- End screen: subscribe + one or two videos over the right half of the outro card',
        ]),
    '',
    ...(warnings.length
      ? ['## Check', '', ...warnings.map(w => `- ${w}`), '']
      : []),
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'youtube.md'), md);
  return warnings;
}
