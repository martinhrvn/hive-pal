# Guide ideas

A plan for covering every major part of Hive Pal with a video. **Guides** are
full desktop walkthroughs (16:9, no length limit, chapters). **Shorts** are one
task in the mobile pass (9:16, about 60 s), cut from the same flow where
possible. How to write and record them: `README.md` and the `living-guide` skill.

Status: ✅ recorded · 🟡 needs app or fixture work first · 🎥 mixes in real
footage (see below) · blank = ready to write.

Priority: **P1** is what every new user meets, **P2** is regular seasonal
work, **P3** is power features and the long tail.

## Done

| File                         | Format   | Covers                                                                                                                       |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `getting-started.guide.ts`   | Guide ✅ | Sign-up, apiary, first hives, hive layout, settings, dashboard tour                                                          |
| `harvest.guide.ts`           | Guide ✅ | Recording a harvest: frames, weights, split between hives, finalize                                                          |
| `quick-check.guide.ts`       | Short ✅ | Quick check at the hive: tags, note, timeline                                                                                |
| `mobile-inspection.guide.ts` | Short    | Full inspection in the mobile wizard: counters, queen, photo and note, review (script done; voice pending)                   |
| `brood-timeline.guide.ts`    | Short    | Queen cell timing on the free brood timeline: emergence date, castes compared (script done; voice pending)                   |
| `syrup-calculator.guide.ts`  | Short    | The free syrup calculator: 2:1 for autumn, 1:1 for spring, how much sugar and water (script done; voice pending)             |
| `varroa-treatment.guide.ts`  | Short    | Logging a treatment from Add Entry: product, amount, timeline, active ingredients (script done; voice pending)               |
| `hives.guide.ts`             | Guide    | Creating a hive, alerts, todos, analytics, the box editor in detail, sidebar actions, archiving (script done; voice pending) |

## Hives

| Idea                        | Format | P   | Flow                                                                     | Notes                                                                                            |
| --------------------------- | ------ | --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Splitting a colony          | Guide  | P2  | Split wizard: frames → new hive → queen → confirm; both hives afterwards |                                                                                                  |
| Split in 60 seconds         | Short  | P2  | Same flow, one pass                                                      |                                                                                                  |
| Hive status changes         | Short  | P3  | Mark a hive dead, sold, combined; what happens to it in lists            |                                                                                                  |
| QR codes for your hives     | Guide  | P2  | Print QR labels, then scan one with the + button to jump to the hive     | 🎥 Film printing, sticking the label on a hive and scanning it; the app part is a recorded guide |
| Scan, inspect, done         | Short  | P2  | Scan a hive's QR code on the phone → quick check                         | 🎥 Phone footage of the scan, then the recorded quick check                                      |
| Hive summary for an AI chat | Short  | P3  | "LLM prompt" dialog: copy a hive's history into ChatGPT/Claude           |                                                                                                  |

## Inspections

| Idea                       | Format | P   | Flow                                                                                                                     | Notes                                                                                                               |
| -------------------------- | ------ | --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Your first inspection**  | Guide  | P1  | Create inspection: weather, observations, scores, notes, photos, box changes; then the detail page and the hive timeline | The core flow; long, use chapters                                                                                   |
| Inspect with your voice    | Guide  | P1  | Audio quick inspection: record, transcript, AI draft, review and save                                                    | 🟡 Fake mic input (`--use-file-for-fake-audio-capture`) plus a transcription worker on preview, or mocked responses |
| Talk, don't type           | Short  | P1  | Same, phone only, the "hands on the frames" pitch                                                                        | 🟡 Same as above                                                                                                    |
| Scheduling inspections     | Guide  | P2  | Schedule one, see it on the calendar and dashboard, reminders in settings, turn it into a real inspection                |                                                                                                                     |
| Batch inspections          | Guide  | P3  | A batch across several hives in one apiary visit; batch list and detail                                                  |                                                                                                                     |
| Reading inspection history | Short  | P2  | Inspection list: filters, recent vs upcoming, open one                                                                   | Needs seeded inspections                                                                                            |

## Actions and treatments

| Idea                        | Format | P   | Flow                                                                                                        | Notes                                     |
| --------------------------- | ------ | --- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Feeding your bees**       | Guide  | P2  | Log a feeding (syrup type, amount), feeding section on the hive, totals in reports; syrup calculator tie-in |                                           |
| Log a feeding               | Short  | P2  | + button → feeding → save                                                                                   |                                           |
| Varroa treatments           | Guide  | P2  | Treatment products, logging a treatment, treatment summary on the hive, varroa management tool              |                                           |
| Bulk Add                    | Guide  | P2  | Pick a date and hives, build an action / inspection / queen entry, the queue, apply                         | Great for "fed all twelve hives today"    |
| Same feeding, every hive    | Short  | P2  | Bulk Add the autumn feeding to all hives at once                                                            |                                           |
| Notes, photos and documents | Short  | P3  | Quick add a photo or note; where it shows up (timeline, Files)                                              | 🟡 Photo upload: use a fixture image file |

## Queens

| Idea                        | Format | P   | Flow                                                                                    | Notes |
| --------------------------- | ------ | --- | --------------------------------------------------------------------------------------- | ----- |
| **Keeping track of queens** | Guide  | P2  | Add a queen (colour by year, mating, traits), assign to a hive, queen history, transfer |       |
| What colour is my queen?    | Short  | P3  | The year colour code, marking a queen in Hive Pal                                       |       |
| Virgin queen to laying      | Short  | P3  | Virgin queen status through mating to laying                                            |       |

## Planning and overview

| Idea                    | Format | P   | Flow                                                                            | Notes                                   |
| ----------------------- | ------ | --- | ------------------------------------------------------------------------------- | --------------------------------------- |
| **Reports**             | Guide  | P2  | Overview, charts, trends: honey, feeding totals, health scores, hive comparison | Needs a season of seeded data           |
| Calendar                | Short  | P2  | What's on the calendar, past work by day, upcoming inspections                  |                                         |
| Todos                   | Short  | P2  | Add a todo to a hive, see it on the hive and the todo list, tick it off         |                                         |
| Equipment planning      | Guide  | P3  | Equipment settings, target multiplier, what to buy before spring                |                                         |
| Several apiaries        | Guide  | P3  | Second apiary, switching, the all-apiaries view, moving a hive                  |                                         |
| Weather for your apiary | Short  | P3  | Location pin, forecast on the dashboard and in inspections                      | Weather mock exists (`weather-mock.ts`) |

## Free tools

These work without an account, so they also make good marketing Shorts.

| Idea                     | Format | P   | Flow                                                          | Notes |
| ------------------------ | ------ | --- | ------------------------------------------------------------- | ----- |
| Swarm management methods | Guide  | P3  | Overview, then artificial swarm, Pagden, Demaree side by side |       |
| One method each          | Shorts | P3  | Artificial swarm / Pagden / Demaree, one Short each           |       |
| Liebefelder method       | Short  | P3  | Estimating colony strength by eye                             |       |
| Varroa management        | Short  | P2  | The varroa tool: monitoring and treatment timing              |       |

## HiveHub (scales and sensors)

| Idea                            | Format | P   | Flow                                                                       | Notes                                                                                                                                                                       |
| ------------------------------- | ------ | --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HiveHub: weight and sensors** | Guide  | P3  | Claim a hub, map scales to hives, calibration, dashboard, insights, alerts | 🎥 Footage of the hardware (ask the HiveHub side for it) for claiming and installing; the dashboard part 🟡 needs seeded device data or API mocks, since preview has no hub |
| Reading your hive's weight      | Short  | P3  | Weight curve: nectar flow, robbing, swarm drop                             | 🎥 🟡 Footage of the scale under a hive, plus seeded weight data                                                                                                            |
| Sound and traffic               | Short  | P3  | Audio panel and bee traffic card                                           | 🎥 🟡 Footage of the entrance sensor, plus seeded data                                                                                                                      |

## AI assistants (MCP)

Hive Pal is an MCP server (`/api/mcp`, see `docs/docs/user-guide/mcp.md`):
Claude and other MCP clients can read apiaries, hives, inspections, due
inspections and todos, and, with write access, record inspections, feedings,
todos and queen updates. It is the landing page's "bring your own assistant"
feature, so it gets a guide early.

The chat itself happens in Claude, which a guide cannot record, so these are
🎥: a screen recording of Claude, with the Hive Pal parts recorded as a
guide. The guide can play the MCP client itself: register an OAuth client,
open the authorize URL and record the sign-in and consent pages, then call
the MCP tools with the token so the "after" state in the app is real.

| Idea                           | Format | P   | Flow                                                                                                                                                                                                                                                             | Notes                                                                |
| ------------------------------ | ------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Connect Claude to Hive Pal** | Guide  | P1  | Claude: Settings → Connectors → add `/api/mcp` → Hive Pal sign-in and consent (what it can read and write) → "which hives haven't been inspected in three weeks?" → "log two litres of 1:1 syrup on Hive 2" → the feeding on Hive 2's timeline, sugar calculated | 🎥 Claude screen recording; consent page and app parts as a guide    |
| Ask Claude about your hives    | Short  | P1  | One question, one answer: which hives are due, what was the last inspection of Hive 1                                                                                                                                                                            | 🎥 Phone recording of the Claude app                                 |
| Log a feeding by chatting      | Short  | P2  | "Fed Hive 2 two litres of syrup" → Claude confirms before writing → it shows up in Hive Pal                                                                                                                                                                      | 🎥 Claude, then the recorded hive timeline                           |
| What can the assistant do?     | Short  | P2  | The consent page explained: read always, write only when asked, never delete, viewer roles stay read-only                                                                                                                                                        | Consent page is recordable as a guide; the trust angle for the pitch |
| Hive Pal in Claude Code        | Short  | P3  | `claude mcp add --transport http hivepal …/api/mcp`, `/mcp` to sign in, a question in the terminal                                                                                                                                                               | 🎥 Terminal recording; for the self-hosting / developer crowd        |

## AI and sharing

| Idea                | Format | P   | Flow                                                      | Notes                                                      |
| ------------------- | ------ | --- | --------------------------------------------------------- | ---------------------------------------------------------- |
| Ask the assistant   | Guide  | P3  | Assistant chat about a hive; the advisory disclaimer      | 🟡 Needs the LLM available on preview, or a recorded reply |
| Share your season   | Short  | P3  | Share dialog: preview image, link, revoke                 |                                                            |
| Beekeeping together | Guide  | P3  | Invite someone to an apiary, join page, what they can see | 🟡 Needs a second user in the same run                     |

## Account and data

| Idea                   | Format | P   | Flow                                                         | Notes                                                                   |
| ---------------------- | ------ | --- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Your data is yours     | Short  | P2  | Data transfer: export ZIP, import, recent jobs               | Good for the open-source pitch                                          |
| Sign in with a passkey | Short  | P3  | Add a passkey in settings, sign in with it                   | 🟡 Virtual authenticator (CDP `WebAuthn`)                               |
| Install on your phone  | Short  | P2  | Add Hive Pal to the home screen (PWA), offline at the apiary | 🎥 Install prompt is not in headless Chromium: a phone screen recording |
| Feedback and releases  | Short  | P3  | Sending feedback, release notes page                         |                                                                         |

## Real footage

Some videos are about things that happen away from the screen: a QR label on
a hive, a scale under it, a phone at the apiary. For those, film the real
part and keep the app part a recorded guide, so it still runs as a test and
re-records when the UI changes.

For now the two are cut together by hand (Kdenlive): record the guide, then
drop the clips in at the chapter breaks. Film in the video's format
(landscape 1080p for guides, portrait for Shorts) and leave room for a line
of voiceover over each clip. If this becomes common, a `g.footage(file, {
voiceover })` cue could splice clips into the video and narrate them like any
other cue, so the cut is reproducible too.

Footage to collect:

- QR labels: printing, sticking one on a hive, scanning it with a phone.
- HiveHub: the hub and scales being set up and sitting under hives (ask for this).
- At the apiary: opening a hive, phone in hand, for the inspection and quick-check intros.
- Installing Hive Pal on a phone (screen recording).
- Claude (web, phone app, Claude Code) connected to a demo account: adding the
  connector and a few questions and requests, for the MCP videos. Use a demo
  account with seeded data, never a real one.

## Suggested order

1. **Connect Claude to Hive Pal** (guide) and **Ask Claude about your
   hives** (short): the feature that sets Hive Pal apart.
1. **Your first inspection** (guide) + **Inspecting on your phone** (short):
   the core loop after getting started.
1. **Your hive at a glance**: extend `seedDemo` with a season of history,
   which the reports, calendar and inspection-history videos reuse.
1. **Feeding your bees**, **Bulk Add**, **Varroa treatments**: autumn work.
1. **Keeping track of queens**, **Splitting a colony**: spring work.
1. Free-tool Shorts: cheap to make, no account, useful for marketing.
1. The 🟡 ones, once their fixture work is done: voice inspections first,
   since that is the landing page's headline feature.
