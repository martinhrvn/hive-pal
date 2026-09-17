# Manual hive weight capture with position (box) and side dimensions

> Draft issue — "What is / What should be". Builds on the existing generic
> `Measurement` model.

## What is (current state)

Hive weight exists in Hive-Pal in three disconnected forms, none of which lets a
beekeeper record a **manually measured** weight:

1. **Inspection / QuickCheck** — no weight field at all
   (`packages/shared-schemas/src/inspections/observations.schema.ts` has
   strength, brood, stores, frames, queen… but no weight).
2. **Generic `Measurement` model** (`apps/backend/prisma/schema.prisma`) — a
   clean per-hive time-series (`metric`, `value`, `unit`, `recordedAt`,
   `source`) with ingest (`POST /hives/:id/measurements`, **API-key only**) and
   read endpoints, but **no manual-entry endpoint and no UI**. Already covered
   by the account-transfer export.
3. **HiveScale IoT integration** — rich, but requires dedicated hardware plus an
   external service and is not linked to the `Hive` entity.

So a beekeeper who weighs by lifting one side of the hive with a scale, or does
a full weighing, has nowhere to record it, view its trend, or keep it on the
digital stock card. Both BEEP and Hive-Pal currently treat weight as a
sensor-only quantity; classic beekeeping practice records it by hand.

## What should be (goal)

Let beekeepers record weight readings manually, building on the **existing
`Measurement` model** (`metric = "weight"`). Because a one-sided lift is a
*partial* reading, we must capture **where** it was taken along two independent
axes:

- **Vertical / which box** — link to the existing `Box` model.
- **Side / edge** — front (entrance), back, left, right.

### Data model

Extend `Measurement`:

```prisma
model Measurement {
  // …existing fields (metric, value, unit, recordedAt, source)…
  boxId  String?          // vertical position: configured Box; null = base / whole hive lifted from the bottom
  box    Box?    @relation(fields: [boxId], references: [id], onDelete: SetNull)
  side   MeasurementSide? // null = whole/total weight (no specific edge)

  @@index([hiveId, metric, boxId, side, recordedAt])
}

enum MeasurementSide {
  FRONT // entrance / Flugloch
  BACK
  LEFT
  RIGHT
}
```

**Null semantics (documented, user-facing):**

- `side = null` → the value is a **whole-hive / total weight** (full weighing),
  not an edge reading.
- `boxId = null` → measured at the **base ("ganz unten")**, lifting the whole
  stack from the bottom; alternatively the beekeeper may pick the lowest
  configured box.

Both axes are freely combinable; readings from one visit are grouped by a shared
`recordedAt`. A box must already exist in the box configurator to be selectable.

### Backend

- `measurementInputSchema` + response schema: add optional `boxId`, `side`.
- New **JWT-protected manual create endpoint** (the current ingest is API-key
  only, for machines) with apiary-ownership checks, and validation that `boxId`
  belongs to the target hive. Optional edit / delete for corrections.
- Update `findLatestForHive` to key on `(metric, boxId, side)` instead of
  `metric` alone, so left / right / box readings don't overwrite each other.

### Frontend

- Entry form on the hive detail page: date/time, value, unit (reuse
  `formatWeight`, kg/lb from `apps/frontend/src/utils/unit-conversion.ts`), box
  selector (from configured boxes, incl. "whole hive / base" = null), side
  selector (incl. "whole, no side" = null).
- Display: weight trend chart on the hive detail page, filterable / series-split
  by box and side; latest values summarized.
- i18n for the new labels.

### Docs

- Document manual weight capture and the null conventions (`side = null` → whole
  weight; `boxId = null` → base / whole hive).

## Out of scope (possible follow-ups)

- Delta / net-weight (honey-flow) computation from the trend (BEEP-style).
- Merging manual readings with HiveScale automatic weight in one chart.
- Qualitative heft estimate (light / medium / heavy).

## Acceptance criteria

- [ ] A beekeeper can add, view, and delete a manual weight reading for a hive
      via the UI.
- [ ] Each reading can optionally reference a configured box and a side
      (front / back / left / right).
- [ ] `boxId = null` and `side = null` behave as documented; both are
      combinable.
- [ ] Latest-value logic distinguishes readings by box and side.
- [ ] Readings appear in a trend chart and in the account-transfer export.
- [ ] kg/lb display follows the user's unit preference.
