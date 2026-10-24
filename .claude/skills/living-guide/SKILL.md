---
name: living-guide
description: Write, voice, record and publish a Hive Pal living guide (narrated Playwright video in apps/e2e/guides). Use when adding or changing a guide, writing its voiceover script, generating the TTS narration, recording guide videos, or making a guide's YouTube thumbnail and metadata (title, description, chapters, tags).
---

# Living guides: script, voice, video

A guide is a Playwright spec in `apps/e2e/guides/<slug>.guide.ts`. It runs as an
e2e test in CI and records a narrated video with `GUIDE=1`. The reference for the
narrator API, output files, passes and providers is `apps/e2e/guides/README.md`;
read it before writing a new guide. This skill is the workflow.

## 1. Write the flow

- Interaction goes in page objects (`packages/page-objects/src/<feature>/`), not
  the guide. Expose show-only elements as locators so the guide can point at them.
- Start with `g.intro(title, description)`; use `g.chapter` per section and
  `g.point` / `g.tour` / `g.do` / `g.say` for cues.
- End full guides with `g.outro()` (the shared closing card with links and
  like / share / subscribe). Shorts skip it.
- Assert what you narrate (a plain `expect` next to a caption that states a fact).
- Use the `demo` fixture for seeded data (Home Apiary, Hive 1–3, one harvest), or
  sign up on screen like `getting-started.guide.ts`.
- Full guides: no length limit. Shorts (mobile pass only, one task): ~60 s.
- Check the flow first in CI mode, which is fast and needs no voice:
  `pnpm test:guides <slug>` (against `localhost:5173`, or set `BASE_URL`).

## 2. Write the voiceover script

Captions and voice are separate. Captions stay short on screen (under ~80
characters); every cue gets a `voiceover` with what the narrator says:

```ts
await g.point(dashboard.locationNudge, 'Add a location to get weather', {
  voiceover:
    'Hive Pal already made an apiary for you. It just needs a location, so it can show your weather.',
});
await g.do('Save', () => form.submitForm(), {
  target: form.submitButton,
  voiceover: 'Save, and your apiary is ready.',
});
```

Where it goes: third argument of `intro` / `chapter` (`undefined` for a missing
description), last options object of `say` / `point` / `do`, third tuple element
of a `tour` stop.

When a `do` opens a tab or an accordion, add `reveal: true`: the target then
scrolls to the top so its content is on screen, not below the fold.

Writing rules (each one came from a take that sounded wrong):

- **Every cue gets a voiceover.** Captions alone read as a choppy list of
  fragments ("Name it." "Save."). That was the problem with the first
  getting-started take.
- **One continuous script.** Lines lead into each other: "Set the date the
  colony was installed," → "and save."; "This one shows…," → "and here's…".
  Read all the voiceovers top to bottom as a single text before generating.
- **Say why, not only what.** "That pin is how Hive Pal knows which weather is
  yours", not "Drop a pin".
- **Spell out numbers and units** ("eighteen kilos", not "18 kg"); no symbols,
  abbreviations or UI glyphs ("plus button", not "+").
- **Name buttons as plain words** ("click Start Harvest"), without quotes.
- **Commas for breathing**: TTS pauses at commas and full stops, not elsewhere.
- **Speak about what is on screen right now.** A cue holds until its clip ends,
  so a long line on a static screen feels slow. Split it across cues instead.
- **Friendly, for beekeepers.** No developer words, no sales pitch.
- Every edit to a line is a new paid clip. Settle the wording before generating,
  and show the script to the user first when it is new.

## 3. Generate the voice (before recording)

Voice settings live in the git-ignored `apps/e2e/.env.local`
(`GUIDE_VOICE=gemini`, `GEMINI_API_KEY`). The default narrator is Gemini
`gemini-3.8-flash-tts`, voice Ludo, no tone prompt (`VOICE_PROFILES` in
`voice.ts`), with one clip per line.

```bash
cd apps/e2e
pnpm guides:voice <slug>
```

This runs the guide as a plain test against preview and synthesizes every
line that is not cached. Requests are spaced to 9 a minute (Gemini allows 10,
even on a paid key), so expect about 7 s per new line. Clips are cached in
`~/.cache/hive-pal/guide-voice/`, keyed by engine, model, voice, style and
text. Unchanged lines cost nothing; never delete the cache to "fix" something.

- This calls a paid API: ask the user before running it, and say how many new
  lines it will generate.
- 429: it waits and retries by itself. 402: prepaid credits ran out, and the
  user has to top up.
- Changing the voice, model or profile invalidates every clip for that guide.

For a single consistent voice across the whole guide, `pnpm guides:take <slug>`
synthesizes all lines as one take (one request), cuts it into lines with
Whisper and fills the cache with them; it collects the lines itself with a quick
plain-test pass, so no earlier recording is needed. Lines it cannot cut cleanly
are listed; run `guides:voice` afterwards to generate just those, then record.
Same paid-API rule: ask first.

## 4. Record the video

```bash
pnpm guides:record <slug>                                  # desktop, 1920×1080, 30 fps
GUIDE_PASSES=mobile pnpm guides:record <slug>              # Short, 1080×1920
GUIDE_PASSES=mobile GUIDE_VOICE_PROFILE=upbeat pnpm guides:record quick-check
```

- Always ask before recording. A run takes several minutes, and starting a
  second one by mistake throws away the first one's `out/guides/<slug>/`.
- Run `guides:voice` first. A cache miss during recording freezes the video
  while the clip is generated, and gets rate limited.
- Background music comes from `GUIDE_MUSIC` (a file outside the repo) at
  `GUIDE_MUSIC_VOLUME` dB under the voice (default -16). See the README.
- Gemini also caps each TTS model at 100 requests a day on this key; the
  quota resets at midnight Pacific. Re-voicing every guide uses most of it.
- It records `https://preview.hivepal.app` (latest main) by default. Set `BASE_URL`
  only to record an undeployed local change.
- Run it in the background and wait for it to finish; don't poll with new runs.
- NixOS: run Playwright inside the dev shell:
  `env -u LD_LIBRARY_PATH devenv shell -- bash -c 'cd apps/e2e && pnpm guides:record <slug>'`.
- Guides that navigate through the sidebar fail in the mobile pass (the sidebar
  is behind a menu on phones). Either skip the mobile pass or add a page-object
  method that opens the menu.

## 5. Check the result

Output is in `apps/e2e/out/guides/<slug>[-mobile]/`: `video.mp4` (with audio),
`narration.wav`, `captions.vtt`, `script.md` (each caption with its 🎙 voiceover
and a screenshot) and `shots/`.

- Confirm `video.mp4` has an audio stream and a sensible length:
  `ffprobe -v error -show_entries format=duration:stream=codec_type -of compact out/guides/<slug>/video.mp4`.
- Check frames where it matters (the intro card should be the first frame):
  `ffmpeg -ss 0.5 -i video.mp4 -frames:v 1 /tmp/…/frame.png`, then view the image.
- Skim `script.md` for lines that no longer match the screen.
- Report the length, clip count and any failed pass to the user. Don't commit
  `out/`; it is git-ignored.

## 6. Thumbnail

`pnpm guides:thumbnail` renders a 1280×720 PNG from
`apps/e2e/guides/thumbnail/thumbnail.html`, in the intro-card look: forest
green, honey hexagons, logo, a big Bricolage title, a subtitle, and a tilted
crop of one of the guide's screenshots.

```bash
cd apps/e2e
pnpm guides:thumbnail harvest --title "Honey|harvest" \
  --sub "From frames to kilos,|hive by hive" \
  --shot 030-point --crop 614,229,692,360 --tilt=-5
# → out/guides/harvest/thumbnail.png
```

- **Title:** two or three words, split over two lines with `|`. It has to read
  at phone size, so no more than about 8 characters per line.
- **Subtitle:** the promise of the video in a few words, also split with `|`.
- **Screenshot:** pick from the recording's `shots/` (the names are listed in
  `script.md`). Choose the most visual moment, not the busiest page: a card, a
  result, something coloured (harvest uses the orange share card). Crop to that
  element with `--crop x,y,w,h` in screenshot pixels (1920×1080). Avoid
  captions and the dimmed spotlight in the crop. Leave `--shot` out for a
  text-only thumbnail.
- Run it inside the dev shell on NixOS (it launches Chromium):
  `env -u LD_LIBRARY_PATH devenv shell -- bash -c 'cd apps/e2e && pnpm guides:thumbnail …'`.
- Look at the PNG before handing it over, then tell the user the command you
  used, so it can be re-rendered after the next recording.

## 7. YouTube metadata

Each guide has a committed `apps/e2e/guides/<slug>.youtube.json` next to its
spec. Every recording turns it into `youtube.md` (to copy from) and
`youtube.json` next to `video.mp4`, with the chapter times taken from that
recording. To regenerate without recording (after editing the JSON):

```bash
cd apps/e2e
pnpm guides:metadata harvest            # or quick-check-mobile for a Short
```

```json
{
  "title": "Recording a honey harvest in Hive Pal: from frames to kilos, hive by hive",
  "summary": "Two or three plain sentences on what the video covers.",
  "tags": ["honey harvest", "honey extraction"],
  "hashtags": ["beekeeping", "honeyharvest", "hivepal"],
  "chapters": {
    "Honey harvests": "The harvest overview",
    "A new harvest starts as a draft": "Frames and weight"
  }
}
```

Writing it:

- **title:** what the viewer will do, plus "in Hive Pal". Under 100
  characters, ideally about 70 before any colon part. Shorts: a short promise
  ("Log a hive check in seconds with Hive Pal"); `#Shorts` is added for you.
- **summary:** two or three plain sentences for beekeepers. No sales
  language: Hive Pal is free and open source, with no paid tier.
- **tags:** four to six topic phrases a beekeeper would search for (honey
  extraction, varroa treatment…); the generic ones (beekeeping, hive pal,
  open source…) are added from `DEFAULT_TAGS` in `youtube.ts`.
- **hashtags:** up to three, without `#`.
- **chapters:** cards (intro, chapters, outro) are chapters already, named
  after their title. The keys are captions exactly as in `captions.vtt`
  (curly apostrophes included): map a card's title to rename it, another
  caption to start a chapter there, or a caption to `null` to drop one.
  YouTube needs the first at 0:00 (automatic), at least three chapters, and
  10 s or more each; the generator checks and lists problems under "Check" in
  `youtube.md` (and as test annotations when recording).

The links (app, docs, GitHub) are added to every description from `LINKS` in
`youtube.ts`. `youtube.md` also lists what to upload: the video, the
thumbnail, `captions.vtt` as subtitles (Subtitles → Upload file → With
timing), and for full guides the end screen (subscribe and one or two videos
over the right half of the outro card).
