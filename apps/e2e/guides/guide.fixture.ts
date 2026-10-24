import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Locator, Page, TestInfo } from '@playwright/test';
import {
  expect,
  test as smokeTest,
  type SeedHive,
  type SmokeUser,
} from '../tests/smoke/fixtures';
import { caption, type Caption } from './captions';
import { addMusic, FrameRecorder, mixNarration } from './media';
import {
  defaultHoldMs,
  Narration,
  VOICE_BREATH_MS,
  type Cue,
  type CueKind,
} from './narration';
import {
  captionCommand,
  cardCommand,
  ringCommand,
  spotCommand,
  stage,
  type Box,
  type CardCta,
  type CardKind,
  type CardLink,
  type StageCommand,
  type Viewport,
} from './overlays';
import { voiceFromEnv, type VoiceProvider } from './voice';
import { writeYoutube } from './youtube';

export { expect };
export { t } from './captions';

/** GUIDE=1 records video + narration; otherwise guides run as plain e2e tests. */
export const GUIDE_MODE = !!process.env.GUIDE && process.env.GUIDE !== '0';
/**
 * GUIDE_PREPARE=1 (`pnpm guides:voice`): run the guides as plain tests and
 * generate every voiceover line into the voice cache, recording nothing.
 * The recording afterwards takes all lines from the cache, so it never waits
 * on the TTS engine or its rate limit.
 */
export const PREPARE_MODE =
  !GUIDE_MODE &&
  !!process.env.GUIDE_PREPARE &&
  process.env.GUIDE_PREPARE !== '0';
/**
 * GUIDE_PREPARE=lines (`pnpm guides:take`): only collect the lines into
 * voiceover.json, generating nothing.
 */
const LINES_ONLY = PREPARE_MODE && process.env.GUIDE_PREPARE === 'lines';
export const GUIDES_OUT_DIR = path.join(__dirname, '..', 'out', 'guides');

/** Delay between keystrokes when a guide types into a field. */
export const TYPING_DELAY_MS = 100;

export type CueOptions = {
  /** Override the hold time (ms); default is the estimated reading time. */
  holdMs?: number;
  /**
   * What the narrator says, when it should be fuller than the caption: the
   * caption stays short on screen while the voice speaks a whole sentence.
   */
  voiceover?: Caption;
};

type SpokenOptions = CueOptions & { spoken?: string };

/** What the narrator says for a cue: its voiceover, else the caption. */
function spokenLine(text: string, opts: SpokenOptions): string {
  return opts.spoken ?? (opts.voiceover ? caption(opts.voiceover) : text);
}

export type DoOptions = CueOptions & {
  /** Element to highlight briefly before the action runs. */
  target?: Locator;
};

type Recording = {
  narration: Narration;
  dir: string;
  voice: VoiceProvider;
  frames: FrameRecorder;
};

/**
 * The narrator handed to guides as `g`. Outside guide mode every method is a
 * no-op apart from its assertions (`point` still checks visibility, `do`
 * still runs the action), so a guide is an ordinary, fast e2e test in CI.
 */
/** Long enough for YouTube's end screen (5–20 s at the end of the video). */
const OUTRO_MS = 15_000;

/** The same closing card on every guide. */
const OUTRO = {
  title: 'Free and open source',
  description:
    'Built in the open by beekeepers and developers. Use it, share it, and help make it better.',
  links: [
    { label: 'Use it online', url: 'hivepal.app' },
    { label: 'Guides and docs', url: 'docs.hivepal.app' },
    { label: 'Source code', url: 'github.com/martinhrvn/hive-pal' },
  ],
  cta: [
    { icon: 'like', label: 'Like' },
    { icon: 'share', label: 'Share' },
    { icon: 'subscribe', label: 'Subscribe' },
  ],
  voiceover:
    'Hive Pal is free and open source, built in the open by beekeepers and developers. You can use it at hivepal.app, and find the code on GitHub. If this guide helped, give it a like, share it with a fellow beekeeper, and subscribe for more.',
} satisfies { links: CardLink[]; cta: CardCta[]; [k: string]: unknown };

type OutroOptions = CueOptions & { title?: Caption; description?: Caption };

export class Guide {
  private recording: Recording | null = null;
  private started = false;
  private prepareVoice?: VoiceProvider;
  private prepared = 0;
  /** Every line spoken, in order (prepare mode). */
  private readonly lines: string[] = [];
  private generated = 0;

  constructor(
    readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /**
   * Opening card: the Hive Pal logo, the guide's title and a line about it.
   * Call it first; it is the video's first frame.
   */
  async intro(title: Caption, description?: Caption, opts: CueOptions = {}) {
    await this.card('intro', title, description, opts);
  }

  /** Full-screen chapter card in the Hive Pal style. */
  async chapter(title: Caption, description?: Caption, opts: CueOptions = {}) {
    await this.card('chapter', title, description, opts);
  }

  /**
   * Closing card: free and open source, where to find Hive Pal, and like /
   * share / subscribe. Call it last; it stays up until the video ends. On
   * landscape it keeps the right half free for YouTube's end screen, which
   * covers the last 5–20 s, so it holds for at least `OUTRO_MS`.
   */
  async outro(opts: OutroOptions = {}) {
    const { title = OUTRO.title, description = OUTRO.description } = opts;
    await this.card(
      'outro',
      title,
      description,
      {
        voiceover: OUTRO.voiceover,
        holdMs: OUTRO_MS,
        ...opts,
      },
      { links: OUTRO.links, cta: OUTRO.cta },
    );
  }

  private async card(
    kind: CardKind,
    title: Caption,
    description: Caption | undefined,
    opts: CueOptions,
    extra: { links?: CardLink[]; cta?: CardCta[] } = {},
  ) {
    const text = caption(title);
    const sub = description === undefined ? undefined : caption(description);
    const spoken = spokenLine(sub ? `${text}. ${sub}` : text, opts);
    if (!GUIDE_MODE) return this.prepare(spoken);
    const card = { kind, title: text, description: sub, ...extra };
    // The intro is already up when the video starts.
    if (kind === 'intro' && !this.started)
      await this.stage(
        cardCommand({ ...card, instant: true }, this.viewport()),
      );
    await this.ensureRecording();
    await this.stage({
      op: 'hide',
      parts: ['spot', 'caption', 'ring', 'cursor'],
    });
    await this.cue(
      'chapter',
      text,
      async (holdMs, shoot) => {
        const started = Date.now();
        await this.stage(cardCommand(card, this.viewport()));
        await shoot();
        await this.waitRest(started, holdMs);
        // The outro is the last frame; everything else gives way to the page.
        if (kind !== 'outro') await this.stage({ op: 'hide', parts: ['card'] });
      },
      { ...opts, spoken, detail: sub },
    );
  }

  /** Caption only. */
  async say(text: Caption, opts: CueOptions = {}) {
    const line = caption(text);
    if (!GUIDE_MODE) return this.prepare(spokenLine(line, opts));
    await this.ensureRecording();
    await this.cue(
      'say',
      line,
      async (holdMs, shoot) => {
        const started = Date.now();
        await this.stage({ op: 'hide', parts: ['spot'] });
        await this.stage(captionCommand(line, this.viewport()));
        await shoot();
        await this.waitRest(started, holdMs);
        await this.stage({ op: 'hide', parts: ['caption'] });
      },
      opts,
    );
  }

  /** Spotlight an element with a caption. Always asserts it is visible. */
  async point(target: Locator, text: Caption, opts: CueOptions = {}) {
    const line = caption(text);
    await expect(target).toBeVisible();
    if (!GUIDE_MODE) return this.prepare(spokenLine(line, opts));
    await this.ensureRecording();
    // A lingering spotlight glides to the next element, but not across a
    // scroll: its old position would be wrong while the page moves.
    if (!(await this.inViewport(target)))
      await this.stage({ op: 'hide', parts: ['spot'] });
    const box = await this.stableBox(target);
    await this.cue(
      'point',
      line,
      async (holdMs, shoot) => {
        const started = Date.now();
        await this.stage(spotCommand(box, line, this.viewport()));
        await shoot();
        await this.waitRest(started, holdMs);
        await this.stage({ op: 'releaseSpot' });
      },
      opts,
    );
  }

  /** Point at several elements in turn. */
  async tour(stops: [Locator, Caption, CueOptions?][], opts: CueOptions = {}) {
    for (const [target, text, stopOpts] of stops)
      await this.point(target, text, { ...opts, ...stopOpts });
  }

  /**
   * Caption + action (usually a page-object call). The caption stays up while
   * the action runs and at least for its reading time.
   */
  async do<T>(text: Caption, action: () => Promise<T>, opts: DoOptions = {}) {
    const line = caption(text);
    if (!GUIDE_MODE) {
      await this.prepare(spokenLine(line, opts));
      return action();
    }
    await this.ensureRecording();
    let result!: T;
    await this.cue(
      'do',
      line,
      async (holdMs, shoot) => {
        const started = Date.now();
        await this.stage({ op: 'hide', parts: ['spot'] });
        await this.stage(captionCommand(line, this.viewport()));
        try {
          let ringFade: Promise<void> | undefined;
          if (opts.target) {
            const box = await this.stableBox(opts.target);
            // The cursor heads for the target while the ring appears, so the
            // action's click lands right away.
            const ringShown = Date.now();
            await Promise.all([
              this.stage(ringCommand(box, this.viewport())),
              moveCursorTo(opts.target, false),
            ]);
            await this.waitRest(ringShown, 1000);
            ringFade = this.stage({ op: 'hide', parts: ['ring'] });
          }
          result = await action();
          await ringFade;
          await this.page.waitForLoadState('networkidle').catch(() => {});
          // Let the viewer see the result before the caption goes away.
          await this.page.waitForTimeout(1200);
          await shoot();
          await this.waitRest(started, holdMs);
        } finally {
          await this.stage({ op: 'hide', parts: ['caption', 'ring'] });
        }
      },
      opts,
    );
    return result;
  }

  // -------------------------------------------------------------------------

  /** Prepare mode: put the line's voice in the cache. Otherwise a no-op. */
  private async prepare(spoken: string) {
    if (!PREPARE_MODE) return;
    this.lines.push(spoken);
    if (LINES_ONLY) return;
    this.prepareVoice ??= voiceFromEnv();
    const n = ++this.prepared;
    console.log(`[voice] ${this.testInfo.title} #${n}: ${spoken}`);
    const clip = await this.prepareVoice.synthesize(
      spoken,
      path.join(os.tmpdir(), 'hive-pal-guide-voice'),
      String(n),
    );
    if (!clip.cached) this.generated++;
  }

  private viewport(): Viewport {
    return this.page.viewportSize() ?? { width: 1280, height: 720 };
  }

  /** The video is recorded in device pixels, so a 1.5× page gives a sharp 1080p video. */
  private async videoSize(): Promise<Viewport> {
    const { width, height } = this.viewport();
    const dpr = await this.page.evaluate(() => window.devicePixelRatio);
    return { width: Math.round(width * dpr), height: Math.round(height * dpr) };
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
    const size = await this.videoSize();
    // Video time 0 and narration time 0 are the same moment.
    const frames = new FrameRecorder(path.join(dir, '.frames'));
    narration.startClock();
    await this.page.screencast.start({
      onFrame: frames.onFrame,
      size,
      quality: 95,
    });
    this.recording = { narration, dir, voice, frames };
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
    const spoken = spokenLine(text, opts);
    const entry: Cue = narration.begin(kind, text);
    entry.detail = opts.detail;
    if (opts.voiceover) entry.spoken = spoken;
    const clip = await voice.synthesize(
      spoken,
      path.join(dir, 'voice'),
      entry.id,
    );
    // Synthesis takes time; the cue starts when it appears on screen.
    entry.start = narration.now();
    if (clip) entry.voice = clip;
    const holdMs = Math.max(
      opts.holdMs ?? defaultHoldMs(text, opts.detail, spoken, clip),
      clip ? clip.durationMs + VOICE_BREATH_MS : 0,
    );
    const shot = `shots/${entry.id}.png`;
    await render(holdMs, async () => {
      // The stage resolves after its transition; give it a frame to paint.
      await this.page.waitForTimeout(100);
      await this.page.screenshot({ path: path.join(dir, shot) });
      entry.shot = shot;
    });
    narration.end(entry);
  }

  private stage(cmd: StageCommand) {
    return stage(this.page, cmd);
  }

  /** Whether the element is fully inside the viewport right now. */
  private async inViewport(target: Locator): Promise<boolean> {
    const box = await target.boundingBox();
    const { width, height } = this.viewport();
    return (
      !!box &&
      box.y >= 0 &&
      box.x >= 0 &&
      box.y + box.height <= height &&
      box.x + box.width <= width
    );
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
    if (PREPARE_MODE) {
      // Exactly what the recording will ask the voice for, so `guides:take`
      // caches its clips under the keys the recording looks up.
      const dir = guideDir(this.testInfo);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'voiceover.json'),
        `${JSON.stringify(this.lines, null, 2)}\n`,
      );
      if (!LINES_ONLY)
        console.log(
          `[voice] ${this.testInfo.title}: ${this.prepared} lines, ${this.generated} generated, ${this.prepared - this.generated} cached`,
        );
    }
    if (!this.recording) return;
    const { narration, dir, frames } = this.recording;
    // Fade out whatever is still on screen before the video ends.
    await this.stage({
      op: 'hide',
      parts: ['spot', 'caption', 'ring', 'cursor'],
    });
    await this.page.waitForTimeout(300).catch(() => {});
    const end = Date.now();
    const durationMs = narration.now();
    await this.page.screencast.stop();
    narration.write(dir);
    // Title, description with chapters and tags, from <slug>.youtube.json.
    const meta = this.testInfo.file.replace(/\.guide\.ts$/, '.youtube.json');
    if (fs.existsSync(meta))
      for (const warning of writeYoutube(
        dir,
        meta,
        this.testInfo.project.name === 'guides-mobile',
      ))
        this.testInfo.annotations.push({
          type: 'youtube',
          description: warning,
        });
    const clips = narration.cues.flatMap(c =>
      c.voice ? [{ clip: c.voice, startMs: c.start }] : [],
    );
    const wav = path.join(dir, 'narration.wav');
    let audio = (await mixNarration(clips, wav)) ? wav : undefined;
    // .env.local values are not shell-expanded, so expand ~ here.
    const music = process.env.GUIDE_MUSIC?.replace(/^~(?=\/)/, os.homedir());
    if (music) {
      const soundtrack = path.join(dir, 'soundtrack.wav');
      const volume = Number(process.env.GUIDE_MUSIC_VOLUME ?? -16);
      if (await addMusic(music, audio, durationMs, soundtrack, volume))
        audio = soundtrack;
    }
    const mp4 = await frames.encode(path.join(dir, 'video.mp4'), audio, end);
    if (!mp4)
      this.testInfo.annotations.push({
        type: 'guide',
        description: 'ffmpeg not found, no video.mp4',
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
export const DEMO_HIVES = ['Hive 1', 'Hive 2', 'Hive 3'] as const;
export type DemoHiveName = (typeof DEMO_HIVES)[number];

export type Demo = {
  user: SmokeUser;
  hives: Record<DemoHiveName, SeedHive>;
  /** A finalized harvest so the overview is not empty. */
  pastHarvest: { id: string; date: Date; weightKg: number; frames: number };
};

/**
 * The same demo apiary for every guide: three hives and one completed
 * harvest (Hive 1: 6 + Hive 2: 4 frames, 18 kg, 45 days ago).
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
      { hiveId: hives['Hive 1'].id, framesTaken: 6 },
      { hiveId: hives['Hive 2'].id, framesTaken: 4 },
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
  guideActions: void;
  guideTiles: void;
}>({
  freshUserName: 'Demo Beekeeper',

  /** Auto fixture: no "new version" toast popping up mid-guide, no dev tools in the video. */
  quietApp: [
    async ({ context }, use) => {
      await context.addInitScript(key => {
        window.localStorage.setItem(
          key,
          JSON.stringify([{ version: '999.0.0', dismissedAt: '2026-01-01' }]),
        );
      }, RELEASE_NOTES_KEY);
      // The React Query devtools button (dev builds only) is not part of the
      // app: keep it out of the video, and from covering the FAB it overlaps.
      await context.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent =
            '.tsqd-open-btn-container { display: none !important; }';
          document.head.append(style);
        });
      });
      await use();
    },
    { auto: true },
  ],

  /**
   * Auto fixture, guide mode only. Page objects stay as they are; their
   * locator actions are made watchable:
   * - a cursor glides to the element before every click, check, fill, …
   *   (Playwright's own `showActions` always shows the action's title);
   * - `fill()` on a text-like field types the value key by key.
   * CI runs are untouched.
   */
  guideActions: [
    async ({ page }, use) => {
      if (!GUIDE_MODE) return use();
      const proto = Object.getPrototypeOf(page.locator('body')) as Record<
        PointerAction,
        (this: Locator, ...args: unknown[]) => Promise<unknown>
      >;
      const originals = POINTER_ACTIONS.map(
        name => [name, proto[name]] as const,
      );

      const fill = proto.fill as Locator['fill'];
      proto.fill = async function (this: Locator, ...args: unknown[]) {
        const [value, options] = args as Parameters<Locator['fill']>;
        const typeable = await this.evaluate(
          isTypeable,
          undefined,
          options,
        ).catch(() => false);
        if (!typeable || value === '') return fill.call(this, value, options);
        // Type over the selection: clearing first lets controlled inputs
        // put a default back (a number field reverting to its min).
        await this.selectText(options);
        await this.pressSequentially(value, {
          delay: TYPING_DELAY_MS,
          timeout: options?.timeout,
        });
      };

      for (const name of POINTER_ACTIONS) {
        const action = proto[name];
        proto[name] = async function (this: Locator, ...args: unknown[]) {
          await moveCursorTo(this, name !== 'hover');
          return action.apply(this, args);
        };
      }
      try {
        await use();
      } finally {
        for (const [name, original] of originals) proto[name] = original;
      }
    },
    { auto: true },
  ],

  /**
   * Auto fixture, guide mode only: let OpenStreetMap tiles and the Leaflet
   * marker icons (served from unpkg) through the third-party block so maps in
   * the video are not grey, and Google Fonts for the cards. CI stays offline
   * (the map still takes clicks). Routes added later win, hence the
   * dependency on blockThirdParty.
   */
  guideTiles: [
    async ({ page, blockThirdParty: _block }, use) => {
      if (GUIDE_MODE) {
        await page.route(/\.tile\.openstreetmap\.org\//, route =>
          route.continue(),
        );
        await page.route(
          /\/\/unpkg\.com\/leaflet@[^/]+\/dist\/images\//,
          route => route.continue(),
        );
        // Brand fonts for the intro and chapter cards.
        await page.route(/\/\/fonts\.(googleapis|gstatic)\.com\//, route =>
          route.continue(),
        );
      }
      await use();
    },
    { auto: true },
  ],

  demo: async ({ freshUser }, use) => {
    await use(await seedDemo(freshUser));
  },

  // Not tied to `demo`: a guide that starts logged out (sign-up) just
  // doesn't request it.
  g: async ({ page }, use, testInfo) => {
    const guide = new Guide(page, testInfo);
    await use(guide);
    // Keep the partial video of a failed run: it shows where the flow broke.
    await guide.finish();
  },
});

/** Fields where typing key by key gives the same result as `fill`. */
function isTypeable(el: Element): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement)
    return [
      'text',
      'search',
      'email',
      'number',
      'tel',
      'url',
      'password',
    ].includes(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

const POINTER_ACTIONS = [
  'click',
  'dblclick',
  'tap',
  'hover',
  'check',
  'uncheck',
  'setChecked',
  'selectOption',
  'fill',
] as const;
type PointerAction = (typeof POINTER_ACTIONS)[number];

/** Glide the guide cursor to the centre of `target`. */
async function moveCursorTo(target: Locator, click: boolean) {
  try {
    await target.scrollIntoViewIfNeeded({ timeout: 5_000 });
    const box = await target.boundingBox({ timeout: 1_000 });
    if (!box) return;
    await stage(target.page(), {
      op: 'cursor',
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      click,
    });
  } catch {
    // Not there (yet): the action itself waits for it and reports failures.
  }
}
