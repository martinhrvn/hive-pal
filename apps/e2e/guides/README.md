# Living guides

A guide is a Playwright spec (`guides/<name>.guide.ts`) that is two things at once:

- **An e2e test.** By default it runs headless, with no video and no pauses. If the
  flow or the UI changes (a button is renamed, a widget disappears), the guide
  fails in CI like any other test.
- **A narrated video.** With `GUIDE=1` the same spec records a video with burned-in
  captions, element spotlights and chapter cards, plus a subtitle track you can
  use as the voiceover script.

```bash
cd apps/e2e
pnpm test:guides       # CI mode: the guides as plain e2e tests
pnpm test:e2e          # smoke suite + guides
pnpm guides:voice      # GUIDE_PREPARE=1: generate the voiceover into the cache
pnpm guides:record     # GUIDE=1: record every guide to out/guides/
pnpm guides:record harvest            # one guide only
GUIDE_PASSES=desktop,mobile pnpm guides:record   # also a portrait (Shorts) pass
```

The target app comes from `BASE_URL`. Recording (`GUIDE=1`) defaults to
`https://preview.hivepal.app`, so videos show the deployed app; the test runs
default to `http://localhost:5173` (`pnpm dev`). Set `BASE_URL` to record a
local change before it is deployed. No account is needed on the target: every
guide signs up its own throwaway user.

## Output

`out/guides/<slug>/` (git-ignored), where `<slug>` is the file name without
`.guide.ts`, with `-mobile` appended for the mobile pass:

| File             | What it is                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `video.mp4`      | H.264, 30 fps, with narration audio when a voice is configured; needs `ffmpeg`                       |
| `captions.vtt`   | One WebVTT cue per chapter/say/point/do with its on-screen caption: chapter times, translation input |
| `subtitles.vtt`  | What the narrator says, timed to the voice in readable chunks: upload this as YouTube subtitles      |
| `script.md`      | The whole narration as text with timestamps and a screenshot per cue                                 |
| `shots/*.png`    | Those screenshots                                                                                    |
| `narration.wav`  | Voice clips placed at their cue times (only with `GUIDE_VOICE`)                                      |
| `soundtrack.wav` | Narration with background music (only with `GUIDE_MUSIC`)                                            |
| `youtube.md`     | Title, description with chapters, tags, upload checklist (from `<slug>.youtube.json`)                |

The video is encoded once, at the end: `page.screencast` hands over each
frame as the browser's JPEG, `FrameRecorder` (`media.ts`) writes them to
`.frames/` and ffmpeg turns them into one x264 encode (CRF 16). Playwright's
own recorder encodes real-time VP8, which smears fades and scrolling.

Recording starts at the first `g.*` call, so navigation you do before it is not
in the video. A failed recording still writes what it got, which shows where the
flow broke.

## Writing a guide

```ts
import { HarvestListPage } from 'page-objects';
import { expect, test } from './guide.fixture';

test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Recording a honey harvest', async ({ page, g, demo }) => {
    const harvests = new HarvestListPage(page);
    await page.goto('/');

    await g.chapter('Honey harvests', 'From frames to kilos, hive by hive');
    await g.do('Let’s open the Harvests page', () =>
      harvests.openFromSidebar(),
    );
    await g.point(
      harvests.totalYieldCard,
      'All the honey from completed harvests',
    );
    await g.tour([
      [harvests.averageYieldCard, 'What a harvest brings in on average'],
      [harvests.historyCard, 'Every harvest is listed below'],
    ]);
    await expect(harvests.historyRows).toHaveCount(1);
  });
});
```

### The narrator, `g`

| Call                             | Guide mode                                                                              | CI mode                              |
| -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| `g.intro(title, description?)`   | Opening card: logo, title, description; the first frame of the video                    | nothing                              |
| `g.chapter(title, description?)` | Full-screen chapter card                                                                | nothing                              |
| `g.outro(opts?)`                 | Closing card: free and open source, links, like / share / subscribe; stays to the end   | nothing                              |
| `g.say(text, opts?)`             | Caption at the bottom                                                                   | nothing                              |
| `g.point(locator, text, opts?)`  | Scroll into view, wait until stable, dim the page around it, caption bubble above/below | `expect(locator).toBeVisible()`      |
| `g.tour([[locator, text], ...])` | `point` for each                                                                        | `expect(...).toBeVisible()` for each |
| `g.do(text, fn, { target? })`    | Caption while `fn` runs, `target` highlighted first; returns `fn`'s result              | runs `fn`                            |

`g.do` also takes `{ reveal }` for an action that opens something below
its target, such as a tab or an accordion: afterwards the page smooth-scrolls
the target (`true`) or another locator to the top, so what opened is in
view while the narrator talks about it.

The intro and chapter cards use the marketing site's look: forest green with
honey hexagons, the logo, Bricolage Grotesque titles and Manrope text (Google
Fonts, let through the third-party block in guide mode). Start a guide with
`g.intro`; it is already on screen when the video starts.

End a full guide with `g.outro()`: the same closing card everywhere (the
text and links are `OUTRO` in `guide.fixture.ts`), with a spoken line, held
for at least 15 s. On landscape it keeps to the left half, leaving the right
half for YouTube's end-screen elements (subscribe button, next videos), which
can cover the last 5 to 20 s; add them in YouTube Studio over that area. In
portrait it stays above the bottom 28% that Shorts cover. Shorts end with
`g.outro({ short: true })` instead: hivepal.app only and a one-line goodbye
(`SHORT_OUTRO`), held just for its clip, since Shorts have no end screens.

Without a voice, each cue holds for its reading time (12 characters per
second, at least 2.5 s); with one, it holds for the clip plus a 0.4 s breath
(and at least as long as the caption on screen takes to read). Pass `{ holdMs }` to override. Nothing in this file waits outside guide mode.

Every call also takes `{ voiceover }`: what the narrator says when it should
be fuller than the caption. The caption stays short on screen, the voice
speaks a whole sentence and the cue holds until it ends. Write the
voiceovers as one continuous script, so lines connect ("This one shows…,"
→ "and here’s…"), and spell out numbers ("eighteen kilos"). `tour` stops take
it as a third element, `chapter` as its third argument; script.md lists each
voiceover under its caption.

```ts
await g.point(
  wizard.dateButton,
  'It’s dated today. Click here to pick another day',
  {
    voiceover:
      'The harvest is dated today. If you took the honey off on another day, click the date and pick the right one.',
  },
);
```

Spotlights and captions are drawn on a "stage" (`overlays.ts`): one element in
its own shadow root under `<html>`, `aria-hidden` and `pointer-events: none`,
so locators never see it. Because it is changed rather than replaced, every
change is a CSS transition: captions fade and rise in, and consecutive `point`s
glide the spotlight from one element to the next (unless the page has to
scroll in between). A spotlight that is not followed by another `point` fades
out after `LINGER_MS`. Timings are the constants at the top of `overlays.ts`.

In guide mode `locator.fill()` on text-like fields (text, number, email,
textarea, …) selects the current value and types the new one key by key
(`TYPING_DELAY_MS`), so page objects get real typing in the video without
changes. Other inputs (dates, selects) keep the instant `fill`.

### Rules of thumb

- **Interaction lives in page objects** (`packages/page-objects/src/<feature>/`):
  locators (prefer `getByRole` / `getByLabel`) and action methods with their own
  `expect`s. No narration in page objects. Expose show-only elements as locators
  too (`harvests.totalYieldCard`) so guides can point at them.
- **Assert what you narrate.** Add a plain `expect` next to a caption that states
  a fact ("the totals are updated") so the guide fails when the fact is no longer true.
- **Mix show, do and configure.** Point at what the page tells you, perform the
  main task end to end through the page object, and point at settings without changing them.
- **Short, friendly captions:** under ~80 characters, written for beekeepers, not developers. Put the fuller explanation in `voiceover`.
- **Length follows the format.** A full guide (desktop) has no length limit: it
  runs as long as the flow needs, and chapters let viewers skip around. A short
  (mobile pass, one task only) should stay around 60 seconds.
- **One guide per file**; the file name is the output slug.
- Edge cases and validation belong in a normal spec (e.g.
  `tests/smoke/extended/harvests.spec.ts`), not in a guide.

## Demo data

Every guide gets a freshly signed-up user ("Demo Beekeeper") with the same data,
seeded through the API by the `demo` fixture in `guide.fixture.ts`:

- apiary "Home Apiary" with hives Hive 1, Hive 2 and Hive 3;
- one finalized harvest 45 days ago (Hive 1: 6 + Hive 2: 4 frames, 18 kg).

Need more? Extend `seedDemo` (shared by all guides) or seed extra data through
`demo.user.api` at the top of your guide. The run uses a fixed viewport
(1280×720), `reducedMotion: 'reduce'`, the Europe/Prague time zone, and the
smoke fixtures' blocking of third-party requests.

A guide that does not request `demo` starts logged out with no account at all:
`getting-started.guide.ts` signs up through the UI and builds its apiary on
screen.

### Network in guides

- **Map tiles:** with `GUIDE=1`, OpenStreetMap tiles and the Leaflet marker icons are let through the
  third-party block (`guideTiles` fixture), so maps in the video are real. In CI
  mode they stay blocked; the map is grey but still takes clicks.
- **Weather:** real weather comes from the backend's scheduled OpenMeteo fetch
  (every 3 hours, the forecast daily), so a new apiary has none. `weather-mock.ts`
  serves a fixed spring forecast instead (`mockWeather(page, apiaryId)`);
  `allowStoredWeather(page)` lets the app read the backend's (empty) weather in
  the meantime. Both work the same in CI mode.

## Guides

| File                       | What it shows                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `getting-started.guide.ts` | Sign-up, the apiary switcher, apiary location, first hives, hive layout, settings, dashboard |
| `harvest.guide.ts`         | Recording a honey harvest from frames to finalized weights                                   |
| `quick-check.guide.ts`     | Short: a quick check at the hive (tags, note, timeline), portrait                            |

`getting-started` skips the mobile pass: arranging hives on the layout is
native drag and drop, which needs a mouse.

### Shorts

A short is a guide about one task, recorded in the mobile pass only (portrait,
for Shorts/Reels). It opens straight on the app, not on an intro card: viewers
decide in the first second, so the first cue is a `g.say` whose caption is the
hook (a question works: "Found queen cells?") and whose voiceover says it out
loud. It ends with `g.outro({ short: true })`. It still runs on desktop in CI,
so it skips the desktop pass in guide mode only:

```ts
test.skip(
  GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
  'short: recorded in the mobile pass only',
);
```

Record it with `GUIDE_PASSES=mobile pnpm guides:record quick-check`; the output
lands in `out/guides/quick-check-mobile/`.

## Captions and translation

Every caption goes through `caption()` in `captions.ts`. Plain strings are fine.
To make a guide translatable, use keys:

```ts
import { t } from './guide.fixture';
await g.say(t('harvest.intro'));
await g.say(t('harvest.weight', { kg: 16 })); // "{{kg}} kg" interpolation
```

Keys are looked up in `guides/locales/<locale>.json` (nested objects, like the app's
i18next files), falling back to `en.json`; a missing key fails the guide in CI as
well. `GUIDE_LOCALE=sk` switches both the captions and the browser locale, so the
app itself is recorded in Slovak. The catalogs are plain JSON so they can be
added to the Weblate pipeline alongside the app's locales.

## Voiceover

`voice.ts` defines `VoiceProvider.synthesize(text) → { file, durationMs }`.
The default `NoopVoice` produces captions only. With a provider configured:

- each cue holds for its clip plus a 0.4 s breath, or the caption's reading time if that is longer, so the video waits for the voice but not much longer;
- the clips are positioned by cue start time into `narration.wav` and muxed into `video.mp4`.

Providers (`GUIDE_VOICE`):

| Value    | Engine                                                                      | Settings                                                    |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `gemini` | [Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation)       | `GEMINI_API_KEY`, `GEMINI_TTS_MODEL` (gemini-3.8-flash-tts) |
| `openai` | [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech)        | `OPENAI_API_KEY`, `OPENAI_TTS_MODEL` (gpt-4o-mini-tts)      |
| `piper`  | Local [Piper](https://github.com/OHF-Voice/piper1-gpl), free, no rate limit | `PIPER_MODEL`, `PIPER_BIN`                                  |

Keys and voice settings can go in the git-ignored `apps/e2e/.env.local`; the
guides config reads only the `GUIDE_*`, `GEMINI_*`, `OPENAI_*` and `PIPER_*`
variables from it (its `BASE_URL` is for `test:smoke:local`), and the shell
overrides the file:

```bash
# apps/e2e/.env.local
GUIDE_VOICE=gemini
GEMINI_API_KEY=...
```

devenv provides `piper`; `piper-voice <name>` downloads a voice
([previews](https://rhasspy.github.io/piper-samples/)) into
`~/.cache/hive-pal/piper` and prints its `PIPER_MODEL`:

```bash
piper-voice en_US-ryan-high
GUIDE_VOICE=piper PIPER_MODEL=~/.cache/hive-pal/piper/en_US-ryan-high.onnx pnpm guides:voice hives
```

Piper clips are cached too, since starting Piper for every cue would stall
the recording; `guides:voice` fills the cache in about a minute.

### Voice profiles

`GUIDE_VOICE_PROFILE` picks a narrator: a tone prompt (or none) plus a
matching voice for each engine (`VOICE_PROFILES` in `voice.ts`).

| Profile              | Use                                  | Gemini voice | OpenAI voice |
| -------------------- | ------------------------------------ | ------------ | ------------ |
| `narrator` (default) | Full guides; no tone prompt          | Ludo         | coral        |
| `upbeat`             | Shorts: bright, lively, a bit faster | Puck         | nova         |
| `mentor`             | An experienced beekeeper, relaxed    | Charon       | ash          |

```bash
pnpm guides:record harvest
GUIDE_PASSES=mobile GUIDE_VOICE_PROFILE=upbeat pnpm guides:record quick-check
```

Override one part of a profile with `GUIDE_VOICE_STYLE` (tone prompt; Gemini
and the gpt-4o OpenAI models; `none` for no prompt), `GEMINI_TTS_VOICE` or `OPENAI_TTS_VOICE`. To add
a profile, add an entry to `VOICE_PROFILES`.

The cloud providers cache each clip in `~/.cache/hive-pal/guide-voice/`
(`$XDG_CACHE_HOME` if set, or `GUIDE_VOICE_CACHE`), keyed by engine, model,
voice, style and text, so re-recording only synthesizes lines that changed.
The cache lives outside the repo so cleaning `out/` does not throw away
clips that cost time and money, and every clone and worktree shares it;
delete the folder to regenerate everything.

Each clip is normalized to the same loudness (-16 LUFS) before mixing, since
separate requests come back several dB apart. Gemini gets a fixed seed, so a
line comes out the same every time; with a tone prompt, the prompt also treats
every line as part of one recording session.

### Generate first, then record

Gemini TTS allows 10 requests a minute even on a paid key (3 on the free
tier), and a line that is not cached yet freezes the video while it is
generated. So generate the voiceover first, then record:

```bash
pnpm guides:voice harvest     # runs the guide as a plain test, fills the cache
pnpm guides:record harvest    # every line from the cache: no waits
```

`guides:voice` targets the same app as recording (preview by default), since
the flow, and so what is said, can differ between deployments. It runs on one
worker and spaces requests to `GUIDE_VOICE_RPM` per minute (default 9); on a
429 anyway, it waits as long as the API asks and retries.

### One take for the whole guide

`pnpm guides:take <slug>` sends the whole voiceover as one TTS request: one
request instead of one per line, in a single consistent voice. It first runs
the guide as a plain test against preview (`GUIDE_PREPARE=lines`: no TTS, no
video, a few seconds) to collect the lines exactly as the recording will ask
for them, into `out/guides/<slug>/voiceover.json`. The take is written to
`out/guides/<slug>/take-<engine>.wav` (and cached like any clip). No
recording is needed beforehand: take, then record.

The take is then cut back into lines. Whisper (whisper.cpp, `whisper-cli` in
devenv) transcribes it with word times, the words are aligned to the known
lines, and each cut goes in the middle of the pause between two lines. Every
line's clip is stored in the voice cache under the same key as if the engine
had generated it alone, so the next `guides:record` takes all its lines from
the take. A line Whisper barely recognises (the engine skipped or changed
words) or with no pause next to it is left out, along with its neighbours;
`pnpm guides:voice` generates those one by one.

```bash
pnpm guides:take harvest
# Split a take you already have; GUIDE_VOICE picks whose cache keys to fill.
pnpm guides:take harvest --audio ~/takes/harvest-ludo.wav
```

`out/guides/<slug>/take-<engine>.txt` is an Audacity label track (Import →
Labels) to check the cuts by ear. The Whisper model (`base.en`, 148 MB) is
downloaded into `~/.cache/hive-pal/whisper` on first use; `WHISPER_MODEL`
points at another ggml model and `WHISPER_BIN` at another binary.

To add another engine, implement `VoiceProvider` and register it in `voiceFromEnv()`.

### Background music

`GUIDE_MUSIC` adds a music bed under the voice: levelled to the voice's
loudness, then `GUIDE_MUSIC_VOLUME` dB lower (default -16, so it stays
faint), looped or cut to the video's length, with a 2 s fade in and 3 s fade
out. `narration.wav` stays voice only; the mix is `soundtrack.wav`, which
goes into `video.mp4`.

```bash
# apps/e2e/.env.local
GUIDE_MUSIC=~/.local/share/hive-pal/guide-music.mp3
GUIDE_MUSIC_VOLUME=-16   # closer to 0 is louder
```

Keep the music file outside the repo: stock-music licences (Pixabay and the
like) allow it in videos but not redistributing the file itself.

## Thumbnails

`pnpm guides:thumbnail <slug>` renders a YouTube thumbnail (1280×720) to
`out/guides/<slug>/thumbnail.png` from `thumbnail/thumbnail.html`: the
intro-card look with a title, a subtitle and a tilted crop of one of the
recording's screenshots.

```bash
pnpm guides:thumbnail harvest --title "Honey|harvest" \
  --sub "From frames to kilos,|hive by hive" \
  --shot 030-point --crop 614,229,692,360 --tilt=-5
```

`|` breaks a line; `--crop x,y,w,h` is in screenshot pixels; without
`--shot` the thumbnail is text only. The `living-guide` skill has tips for
picking the screenshot, and for the video's title and description.

## YouTube metadata

`<slug>.youtube.json` next to a guide holds its title, summary, tags,
hashtags and chapter markers. Each recording writes `youtube.md` (title,
description with chapters and links, tags, upload checklist) and
`youtube.json` next to the video, with chapter times from that recording
and YouTube's chapter rules checked. `pnpm guides:metadata <slug>`
regenerates them without recording. The generator is `youtube.ts`; the
`living-guide` skill explains how to write the JSON.

## Adding a viewport pass

Passes are defined in `playwright.guides.config.ts` (`PASSES`), sized for YouTube:

| Pass      | Viewport (CSS px) | Scale | Video              |
| --------- | ----------------- | ----- | ------------------ |
| `desktop` | 1280×720          | 1.5×  | 1920×1080 (16:9)   |
| `mobile`  | 360×640, touch    | 3×    | 1080×1920 (Shorts) |

The page lays out at the viewport size and renders at the scale, so the video
is sharp. The scale is also passed to Chromium as `--force-device-scale-factor`:
without it, headless Chromium records viewport-sized frames. In portrait,
captions keep the bottom 28% of the frame free, where YouTube draws the Short's
title and buttons (`bottomInset` in `overlays.ts`).

`GUIDE_PASSES=desktop,mobile` records both. A plain run takes it too
(`GUIDE_PASSES=mobile pnpm test:guides <slug>` checks a Short at phone size
without recording); without it, and so in CI, it runs desktop only. The mobile layout hides the sidebar behind a menu, so a
guide that navigates through the sidebar needs a page-object method that opens the
menu first.
