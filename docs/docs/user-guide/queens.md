---
description: Track queen bees in Hive-Pal — record details and marking, follow a queen's movement history across hives, and transfer queens between colonies.
keywords: [queen bee management, queen tracking, queen history, queen movements, queen replacement, queen lineage]
---

# Queen Management

Track individual queens across your operation — their details, where they've lived, and when they were replaced.

## Adding a Queen

You can add a queen from a hive's detail page (the side menu's **Add Queen** option) or from the **Queens** section.

Record details such as:

- **Name / identifier** — an optional label for the queen.
- **Marking color** — the international year color (White, Yellow, Red, Green, Blue).
- **Year** — the queen's birth/marking year.
- **Source** — breeder, swarm, supersedure, etc.
- **Race / strain** — genetic background.
- **Installation date** — when she was introduced to the hive.
- **Notes** — anything else worth recording.

When you add a queen to a hive that already has an active queen, the new queen becomes active and the previous one is marked as replaced.

## Queen History & Movements

Each queen has a detail page (`/queens/:queenId`) showing her full timeline:

- **Movement history** — every hive the queen has lived in, with dates.
- **Status** — whether she is currently active or has been replaced.
- **Details** — marking, source, race, and notes.

On a hive's detail page, the **Queen History** tab lists the active queen plus any past queens for that hive, so you can see the colony's full requeening history.

## Transferring a Queen

To move a queen from one hive to another, use the **transfer** option on the queen's detail page. The move is recorded in her movement history, so the timeline stays accurate for both hives.

## Best Practices

- **Color marking** — follow the international color code so the queen's age is readable at a glance.
- **Record the source** — knowing whether a queen came from a breeder, a swarm, or supersedure helps with future selection.
- **Log replacements promptly** — adding the new queen marks the old one replaced and keeps the hive's history clean.

## FAQ

**What happens to the old queen when I add a new one?**
She's automatically marked as replaced; the new queen becomes the hive's active queen.

**Can I see everywhere a queen has been?**
Yes — the queen's detail page shows her complete movement history across hives.

**How do I move a queen without losing her history?**
Use the transfer action rather than deleting and re-adding — it preserves the timeline.
