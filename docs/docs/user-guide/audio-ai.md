---
title: Audio & AI Transcription
description: Record voice notes during hive inspections in Hive-Pal and let AI transcribe and extract structured inspection data for you.
keywords: [audio inspection, voice notes beekeeping, AI transcription, speech to inspection, hands-free beekeeping]
---

# Audio & AI Transcription

Inspecting a hive often leaves your hands full. Hive-Pal lets you **speak your observations** and have them transcribed and turned into structured inspection data automatically — so you can keep your eyes on the bees.

## When to Use It

- You want a hands-free way to capture observations in the field.
- You'd rather talk through an inspection than tap through a form.
- You want a voice record attached to the inspection for later reference.

## Recording Audio

There are two ways to record:

- **Audio Quick Inspection** (`/hives/:id/inspect/audio`) — a streamlined page focused on recording a voice note for a hive.
- **Within an inspection** — the standard inspection form has an audio section where you can attach a recording.

When you save, the recording is uploaded with the inspection.

## How Transcription & Analysis Work

Processing happens in two stages after upload:

1. **Transcription** — a worker converts your recording to text. The audio card shows the status: *waiting → transcribing → completed* (or *failed*).
2. **AI analysis** — once transcribed, you can trigger analysis. The AI reads the transcript and suggests values for inspection fields (ratings, observations, actions).

You stay in control: review the transcription (edit it if needed), then **merge** the AI's suggestions into the inspection form. Nothing is saved to your inspection until you accept it.

## Requirements

- **File storage** must be enabled (local or S3) to store recordings — see [Configuration → File Storage](../self-hosting/configuration#file-storage).
- The transcription/analysis worker must be running for processing to complete.

## FAQ

**Is my audio kept?**
Recordings are stored in your configured file storage (your own server with local storage, or your S3 bucket). As a self-hosted app, the data stays under your control.

**Can I edit the transcription?**
Yes. The transcribed text is editable before you run analysis or merge it into the inspection.

**Do I have to accept the AI's suggestions?**
No. Suggestions are proposed as mergeable values — you choose what to apply to the inspection.

**What if transcription fails?**
The audio card shows a *failed* state; you can retry. Check that the worker is running and file storage is configured.
