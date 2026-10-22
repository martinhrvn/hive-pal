---
name: living-guide
description: Write, voice and record a Hive Pal living guide (narrated Playwright video in apps/e2e/guides). Use when adding or changing a guide, writing its voiceover script, generating the TTS narration, or recording/re-recording guide videos.
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
