import fs from 'node:fs';
import path from 'node:path';
import type { Locator, Page, TestInfo } from '@playwright/test';
import {
  expect,
  test as smokeTest,
  type SeedHive,
  type SmokeUser,
} from '../tests/smoke/fixtures';
import { caption, type Caption } from './captions';
import { mixNarration, toMp4 } from './media';
import { Narration, readingTimeMs, type Cue, type CueKind } from './narration';
import {
  captionBar,
  highlightRing,
  spotlight,
  type Box,
  type Viewport,
} from './overlays';
import { voiceFromEnv, type VoiceProvider } from './voice';

export { expect };
export { t } from './captions';

/** GUIDE=1 records video + narration; otherwise guides run as plain e2e tests. */
export const GUIDE_MODE = !!process.env.GUIDE && process.env.GUIDE !== '0';
export const GUIDES_OUT_DIR = path.join(__dirname, '..', 'out', 'guides');

export type CueOptions = {
  /** Override the hold time (ms); default is the estimated reading time. */
  holdMs?: number;
};

export type DoOptions = CueOptions & {
  /** Element to highlight briefly before the action runs. */
  target?: Locator;
};

type Recording = {
  narration: Narration;
  dir: string;
  voice: VoiceProvider;
};

/**
 * The narrator handed to guides as `g`. Outside guide mode every method is a
 * no-op apart from its assertions (`point` still checks visibility, `do`
 * still runs the action), so a guide is an ordinary, fast e2e test in CI.
 */
export class Guide {
  private recording: Recording | null = null;
  private started = false;

  constructor(
    readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /** Full-screen title card. */
  async chapter(title: Caption, description?: Caption) {
    const text = caption(title);
    const sub = description === undefined ? undefined : caption(description);
    if (!GUIDE_MODE) return;
    await this.ensureRecording();
    const spoken = sub ? `${text}. ${sub}` : text;
    await this.cue(
      'chapter',
      text,
      async (holdMs, shoot) => {
        const started = Date.now();
        await Promise.all([
          this.page.screencast.showChapter(text, {
            description: sub,
            duration: holdMs,
          }),
          shoot(),
        ]);
        await this.waitRest(started, holdMs);
      },
      { spoken, detail: sub },
    );
  }

  /** Caption only. */
  async say(text: Caption, opts: CueOptions = {}) {
    const line = caption(text);
    if (!GUIDE_MODE) return;
    await this.ensureRecording();
    await this.cue(
      'say',
      line,
      (holdMs, shoot) =>
        this.show(captionBar(line, this.viewport()), holdMs, shoot),
      opts,
    );
  }

  /** Spotlight an element with a caption. Always asserts it is visible. */
  async point(target: Locator, text: Caption, opts: CueOptions = {}) {
    const line = caption(text);
    await expect(target).toBeVisible();
    if (!GUIDE_MODE) return;
    await this.ensureRecording();
    const box = await this.stableBox(target);
    await this.cue(
      'point',
      line,
      (holdMs, shoot) =>
        this.show(spotlight(box, line, this.viewport()), holdMs, shoot),
      opts,
    );
  }

  /** Point at several elements in turn. */
  async tour(stops: [Locator, Caption][], opts: CueOptions = {}) {
    for (const [target, text] of stops) await this.point(target, text, opts);
  }

  /**
   * Caption + action (usually a page-object call). The caption stays up while
   * the action runs and at least for its reading time.
   */
  async do<T>(text: Caption, action: () => Promise<T>, opts: DoOptions = {}) {
    const line = caption(text);
    if (!GUIDE_MODE) return action();
    await this.ensureRecording();
    let result!: T;
    await this.cue(
      'do',
      line,
      async (holdMs, shoot) => {
        const started = Date.now();
        const bar = await this.page.screencast.showOverlay(
          captionBar(line, this.viewport()),
        );
        try {
          if (opts.target) {
            const box = await this.stableBox(opts.target);
            await this.show(highlightRing(box, this.viewport()), 800);
          }
          result = await action();
          await this.page.waitForLoadState('networkidle').catch(() => {});
          // Let the viewer see the result before the caption goes away.
          await this.page.waitForTimeout(400);
          await shoot();
          await this.waitRest(started, holdMs);
        } finally {
          await bar.dispose();
        }
      },
      opts,
    );
    return result;
  }

  // -------------------------------------------------------------------------

  private viewport(): Viewport {
    return this.page.viewportSize() ?? { width: 1280, height: 800 };
  }

  /** Start the screencast on first use, so setup navigation is not recorded. */
  private async ensureRecording() {
    if (this.started) return;
    this.started = true;
    // Don't open the video on a loading screen.
    await this.page.waitForLoadState('networkidle').catch(() => {});
    const dir = guideDir(this.testInfo);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
    const voice = voiceFromEnv();
    const narration = new Narration(this.testInfo.title);
    await this.page.screencast.start({
      path: path.join(dir, 'video.webm'),
      size: this.viewport(),
    });
    narration.startClock();
    await this.page.screencast.showActions({ cursor: 'pointer', fontSize: 0 });
    this.recording = { narration, dir, voice };
  }

  /**
   * Emit a cue: synthesize voice (if configured), work out the hold time and
   * run `render`, which keeps the cue on screen for at least `holdMs` and
   * calls `shoot` once while it is visible (the screenshot for script.md).
   */
  private async cue(
    kind: CueKind,
    text: string,
    render: (holdMs: number, shoot: () => Promise<void>) => Promise<void>,
    opts: CueOptions & { spoken?: string; detail?: string } = {},
  ) {
    const { narration, dir, voice } = this.recording!;
    // Never narrate over skeletons and spinners.
    await this.page.waitForLoadState('networkidle').catch(() => {});
    const spoken = opts.spoken ?? text;
    const entry: Cue = narration.begin(kind, text);
    entry.detail = opts.detail;
    const clip = await voice.synthesize(
      spoken,
      path.join(dir, 'voice'),
      entry.id,
    );
    // Synthesis takes time; the cue starts when it appears on screen.
    entry.start = narration.now();
    if (clip) entry.voice = clip;
    const holdMs = Math.max(
      opts.holdMs ?? readingTimeMs(spoken),
      clip?.durationMs ?? 0,
    );
    const shot = `shots/${entry.id}.png`;
    await render(holdMs, async () => {
      // Let the overlay paint before capturing it.
      await this.page.waitForTimeout(300);
      await this.page.screenshot({ path: path.join(dir, shot) });
      entry.shot = shot;
    });
    narration.end(entry);
  }

  /** Show an overlay for `holdMs`, then remove it. */
  private async show(
    html: string,
    holdMs: number,
    shoot?: () => Promise<void>,
  ) {
    const started = Date.now();
    const overlay = await this.page.screencast.showOverlay(html);
    await shoot?.();
    await this.waitRest(started, holdMs);
    await overlay.dispose();
  }

  /** Wait until `holdMs` have passed since `started`. */
  private async waitRest(started: number, holdMs: number) {
    const left = holdMs - (Date.now() - started);
    if (left > 0) await this.page.waitForTimeout(left);
  }

  /** Scroll into view and wait until the bounding box stops moving. */
  private async stableBox(target: Locator): Promise<Box> {
    await target.scrollIntoViewIfNeeded();
    let prev = await target.boundingBox();
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(100);
      const next = await target.boundingBox();
      if (prev && next && sameBox(prev, next)) return next;
      prev = next;
    }
    if (!prev) throw new Error(`No bounding box for ${target}`);
    return prev;
  }

  /** Stop recording and write video, captions, script and audio. */
  async finish() {
    if (!this.recording) return;
    const { narration, dir } = this.recording;
    await this.page.screencast.stop();
    narration.write(dir);
    const clips = narration.cues.flatMap(c =>
      c.voice ? [{ clip: c.voice, startMs: c.start }] : [],
    );
    const wav = path.join(dir, 'narration.wav');
    const hasAudio = await mixNarration(clips, wav);
    const mp4 = await toMp4(
      path.join(dir, 'video.webm'),
      path.join(dir, 'video.mp4'),
      hasAudio ? wav : undefined,
    );
    if (!mp4)
      this.testInfo.annotations.push({
        type: 'guide',
        description: 'ffmpeg not found, skipped video.mp4',
      });
    this.testInfo.annotations.push({ type: 'guide', description: dir });
  }
}

function sameBox(a: Box, b: Box): boolean {
  return (
    Math.abs(a.x - b.x) < 1 &&
    Math.abs(a.y - b.y) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

/**
 * out/guides/<slug>: the spec file name without `.guide.ts`, suffixed with
 * the viewport pass for anything but desktop (e.g. `harvest-mobile`).
 */
export function guideDir(testInfo: TestInfo): string {
  const slug = path.basename(testInfo.file).replace(/\.guide\.ts$/, '');
  const pass = testInfo.project.name.replace(/^guides-?/, '');
  return path.join(
    GUIDES_OUT_DIR,
    pass && pass !== 'desktop' ? `${slug}-${pass}` : slug,
  );
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

export const DEMO_APIARY_NAME = 'Home Apiary';
export const DEMO_HIVES = ['Linden', 'Acacia', 'Meadow'] as const;
export type DemoHiveName = (typeof DEMO_HIVES)[number];

export type Demo = {
  user: SmokeUser;
  hives: Record<DemoHiveName, SeedHive>;
  /** A finalized harvest so the overview is not empty. */
  pastHarvest: { id: string; date: Date; weightKg: number; frames: number };
};

/**
 * The same demo apiary for every guide: three hives and one completed
 * harvest (Linden 6 + Acacia 4 frames, 18 kg, 45 days ago).
 */
async function seedDemo(user: SmokeUser): Promise<Demo> {
  await user.api.updateApiary(user.apiaryId, { name: DEMO_APIARY_NAME });
  const hives = {} as Record<DemoHiveName, SeedHive>;
  for (const name of DEMO_HIVES)
    hives[name] = await user.api.createHive({ name });

  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 45);
  date.setUTCHours(10, 0, 0, 0);
  const harvest = await user.api.createHarvest({
    date: date.toISOString(),
    notes: 'Spring honey',
    harvestHives: [
      { hiveId: hives.Linden.id, framesTaken: 6 },
      { hiveId: hives.Acacia.id, framesTaken: 4 },
    ],
  });
  await user.api.setHarvestWeight(harvest.id, 18);
  await user.api.finalizeHarvest(harvest.id);
  return {
    user,
    hives,
    pastHarvest: { id: harvest.id, date, weightKg: 18, frames: 10 },
  };
}

/** localStorage key of dismissed release notes (use-release-notes.ts). */
const RELEASE_NOTES_KEY = 'hivepal-dismissed-releases';

export const test = smokeTest.extend<{
  demo: Demo;
  g: Guide;
  quietApp: void;
}>({
  freshUserName: 'Demo Beekeeper',

  /** Auto fixture: no "new version" toast popping up mid-guide. */
  quietApp: [
    async ({ context }, use) => {
      await context.addInitScript(key => {
        window.localStorage.setItem(
          key,
          JSON.stringify([{ version: '999.0.0', dismissedAt: '2026-01-01' }]),
        );
      }, RELEASE_NOTES_KEY);
      await use();
    },
    { auto: true },
  ],

  demo: async ({ freshUser }, use) => {
    await use(await seedDemo(freshUser));
  },

  g: async ({ page, demo: _demo }, use, testInfo) => {
    const guide = new Guide(page, testInfo);
    await use(guide);
    // Keep the partial video of a failed run: it shows where the flow broke.
    await guide.finish();
  },
});
