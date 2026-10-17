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
pnpm guides:record     # GUIDE=1: record every guide to out/guides/
pnpm guides:record harvest            # one guide only
GUIDE_PASSES=desktop,mobile pnpm guides:record   # also a 390×844 pass
```

The target app comes from `BASE_URL` (default `http://localhost:5173`, i.e. `pnpm dev`).

## Output

`out/guides/<slug>/` (git-ignored), where `<slug>` is the file name without
`.guide.ts`, with `-mobile` appended for the mobile pass:

| File            | What it is                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- |
| `video.webm`    | Recording made with Playwright's `page.screencast`                                           |
| `video.mp4`     | H.264 copy (with narration audio when a voice is configured); skipped if `ffmpeg` is missing |
| `captions.vtt`  | One WebVTT cue per chapter/say/point/do: soft subtitles, translation input, TTS script       |
| `script.md`     | The whole narration as text with timestamps and a screenshot per cue                         |
| `shots/*.png`   | Those screenshots                                                                            |
| `narration.wav` | Voice clips placed at their cue times (only with `GUIDE_VOICE`)                              |

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
| `g.chapter(title, description?)` | Full-screen title card                                                                  | nothing                              |
| `g.say(text, opts?)`             | Caption at the bottom                                                                   | nothing                              |
| `g.point(locator, text, opts?)`  | Scroll into view, wait until stable, dim the page around it, caption bubble above/below | `expect(locator).toBeVisible()`      |
| `g.tour([[locator, text], ...])` | `point` for each                                                                        | `expect(...).toBeVisible()` for each |
| `g.do(text, fn, { target? })`    | Caption while `fn` runs, `target` highlighted first; returns `fn`'s result              | runs `fn`                            |

Each cue holds for its reading time (12 characters per second, at least 2.5 s);
pass `{ holdMs }` to override. Nothing in this file waits outside guide mode.

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
- **Short, friendly captions:** under ~80 characters, written for beekeepers, not developers.
  Aim for 60–90 seconds per guide.
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
(1280×800), `reducedMotion: 'reduce'`, the Europe/Prague time zone, and the
smoke fixtures' blocking of third-party requests.

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

- each cue holds for `max(reading time, audio duration)`, so the video waits for the voice;
- the clips are positioned by cue start time into `narration.wav` and muxed into `video.mp4`.

`PiperVoice` is a stub for the local [Piper](https://github.com/rhasspy/piper) CLI:

```bash
GUIDE_VOICE=piper PIPER_MODEL=~/voices/en_GB-alba-medium.onnx pnpm guides:record
```

To add another engine, implement `VoiceProvider` and register it in `voiceFromEnv()`.

## Adding a viewport pass

Passes are defined in `playwright.guides.config.ts` (`PASSES`): `desktop` (1280×800)
and `mobile` (390×844, touch). `GUIDE_PASSES=desktop,mobile` records both; CI mode
always runs desktop only. The mobile layout hides the sidebar behind a menu, so a
guide that navigates through the sidebar needs a page-object method that opens the
menu first.
