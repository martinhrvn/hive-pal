# Activity Model Refactor Migration Plan

> **IMPORTANT**: Update the checkboxes in this document as each step is completed.
> This serves as the source of truth for migration progress.

## Overview

Refactoring from polymorphic Action tables to a unified HiveActivity model with proper Task scheduling.

### Current State
- `Action` table with `ActionType` discriminator
- 5 detail tables: `TreatmentAction`, `FeedingAction`, `FrameAction`, `HarvestAction`, `BoxConfigurationAction`
- `Observation` table with EAV pattern (type + numericValue/textValue/booleanValue)
- No task/follow-up system

### Target State
- `HiveActivity` - unified timeline log with typed JSON
- `Task` - scheduler for follow-ups
- `Inspection` - simplified container with cached summary
- `Harvest` - unchanged (complex workflow)

---

## Migration Checklist

### Phase 1: Preparation
- [ ] Back up production database
- [ ] Review and finalize schema design
- [ ] Create shared-schemas for new types
- [ ] Write unit tests for data transformation logic

### Phase 2: Schema (Additive Only)
- [ ] Create `HiveActivity` table
- [ ] Create `Task` table
- [ ] Add `summary` field to `Inspection`
- [ ] Add `activities` relation to `Inspection`
- [ ] Run migration on staging
- [ ] Verify no breaking changes

### Phase 3: Shared Schemas
- [ ] Create `activity/types.ts` with ActivityType enum
- [ ] Create `activity/details.schema.ts` with all detail schemas
- [ ] Create `inspection/summary.schema.ts`
- [ ] Create `task/task.schema.ts`
- [ ] Export from package index
- [ ] Run type checks

### Phase 4: Backend - New Services
- [ ] Create `HiveActivityService`
- [ ] Create `HiveActivityRepository` with typed JSON handling
- [ ] Create `TaskService`
- [ ] Create `TaskRepository`
- [ ] Add inspection summary update logic
- [ ] Write integration tests

### Phase 5: Data Migration Script
- [ ] Write migration script (see below)
- [ ] Test on staging with production data copy
- [ ] Verify row counts match
- [ ] Verify data integrity
- [ ] Document any edge cases

### Phase 6: Backend - Dual Write
- [ ] Update `InspectionsService.create()` to write to both old and new
- [ ] Update `InspectionsService.update()` to write to both
- [ ] Update `ActionsService.createStandaloneAction()` to write to both
- [ ] Update `HarvestsService.finalize()` to write to both
- [ ] Deploy and monitor for errors

### Phase 7: Backend - Switch Reads
- [ ] Update `InspectionsService` to read from new tables
- [ ] Update `ActionsService.findAll()` to read from HiveActivity
- [ ] Update `CalendarService` to use HiveActivity
- [ ] Update any reports/analytics queries
- [ ] Deploy and monitor

### Phase 8: Frontend Updates
- [ ] Update inspection form to use new activity types
- [ ] Update hive detail page actions section
- [ ] Update calendar view
- [ ] Add task management UI (if needed now)
- [ ] Test all flows end-to-end

### Phase 9: Cleanup (After Confidence Period)
- [ ] Remove dual-write code
- [ ] Remove old Action/Observation services
- [ ] Drop old tables (keep backup)
- [ ] Update documentation

---

## New Prisma Schema

```prisma
// --------------------------------------------------------
// INSPECTION - Visit container with summary cache
// --------------------------------------------------------
model Inspection {
  id              String            @id @default(uuid())
  hiveId          String
  hive            Hive              @relation(fields: [hiveId], references: [id])

  date            DateTime          @default(now())
  status          InspectionStatus  @default(COMPLETED)

  // Session metadata
  weather         Json?             // { temp: 22, conditions: "sunny", humidity: 65 }
  notes           String?           // General summary notes

  // Cached numeric summary for quick display
  summary         Json?             // { strength: 8, honeyFrames: 6, miteCount: 3, ... }

  // Related
  activities      HiveActivity[]
  audioRecordings InspectionAudio[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([hiveId, date])
}

// --------------------------------------------------------
// HIVE ACTIVITY - Unified timeline log
// --------------------------------------------------------
model HiveActivity {
  id           String       @id @default(uuid())
  hiveId       String
  hive         Hive         @relation(fields: [hiveId], references: [id])

  date         DateTime     @default(now())
  type         ActivityType
  details      Json
  notes        String?

  // Parent contexts (optional)
  inspectionId String?
  inspection   Inspection?  @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  harvestId    String?
  harvest      Harvest?     @relation(fields: [harvestId], references: [id])

  // Task relations
  triggeredTasks  Task[]    @relation("TriggeredTasks")
  completedTask   Task?     @relation("CompletedTask")

  createdAt    DateTime     @default(now())
  createdBy    String?

  @@index([hiveId, date])
  @@index([type])
  @@index([inspectionId])
}

enum ActivityType {
  // Observations
  MITE_COUNT
  QUEEN_STATUS
  BROOD
  STORES
  COLONY_STRENGTH
  TEMPERAMENT
  PEST_DISEASE

  // Actions
  FEEDING
  FRAME_MANIPULATION
  BOX_CONFIGURATION
  HARVEST
  TREATMENT

  // General
  NOTE
}

// --------------------------------------------------------
// TASK - Scheduler (hive-scoped)
// --------------------------------------------------------
model Task {
  id                String        @id @default(uuid())
  hiveId            String
  hive              Hive          @relation(fields: [hiveId], references: [id])

  title             String
  description       String?
  dueDate           DateTime
  completedAt       DateTime?
  type              ActivityType?

  // Triggered by an activity
  triggerActivityId String?
  triggerActivity   HiveActivity? @relation("TriggeredTasks", fields: [triggerActivityId], references: [id])

  // Completed by an activity
  completedActivityId String?     @unique
  completedActivity   HiveActivity? @relation("CompletedTask", fields: [completedActivityId], references: [id])

  createdAt         DateTime      @default(now())

  @@index([hiveId, completedAt])
  @@index([dueDate, completedAt])
}
```

---

## Shared Schemas

### ActivityType Enum

```typescript
// packages/shared-schemas/src/activity/types.ts

export enum ActivityType {
  // Observations
  MITE_COUNT = 'MITE_COUNT',
  QUEEN_STATUS = 'QUEEN_STATUS',
  BROOD = 'BROOD',
  STORES = 'STORES',
  COLONY_STRENGTH = 'COLONY_STRENGTH',
  TEMPERAMENT = 'TEMPERAMENT',
  PEST_DISEASE = 'PEST_DISEASE',

  // Actions
  FEEDING = 'FEEDING',
  FRAME_MANIPULATION = 'FRAME_MANIPULATION',
  BOX_CONFIGURATION = 'BOX_CONFIGURATION',
  HARVEST = 'HARVEST',
  TREATMENT = 'TREATMENT',

  // General
  NOTE = 'NOTE',
}
```

### Activity Details Schemas

```typescript
// packages/shared-schemas/src/activity/details.schema.ts

import { z } from 'zod';

// ============ OBSERVATIONS ============

export const miteCountDetailsSchema = z.object({
  method: z.enum(['ALCOHOL_WASH', 'SUGAR_ROLL', 'STICKY_BOARD', 'NATURAL_DROP']),
  count: z.number().int().min(0),
  sampleSize: z.number().int().optional(),
  dropDays: z.number().int().optional(),
  infestationRate: z.number().optional(),
});

export const queenStatusDetailsSchema = z.object({
  seen: z.boolean(),
  marked: z.boolean().optional(),
  markColor: z.string().optional(),
  clipped: z.boolean().optional(),
  laying: z.enum(['good', 'poor', 'none']).optional(),
});

export const broodDetailsSchema = z.object({
  pattern: z.enum(['solid', 'spotty', 'scattered', 'patchy', 'excellent', 'poor']).optional(),
  cappedFrames: z.number().int().min(0).optional(),
  uncappedFrames: z.number().int().min(0).optional(),
  queenCells: z.number().int().min(0).optional(),
  swarmCells: z.boolean().optional(),
  supersedureCells: z.boolean().optional(),
});

export const storesDetailsSchema = z.object({
  honeyFrames: z.number().int().min(0).optional(),
  pollenFrames: z.number().int().min(0).optional(),
  estimatedWeightKg: z.number().optional(),
});

export const colonyStrengthDetailsSchema = z.object({
  score: z.number().int().min(0).max(10),
  framesOfBees: z.number().int().optional(),
});

export const temperamentDetailsSchema = z.object({
  temperament: z.enum(['calm', 'nervous', 'defensive', 'aggressive']),
});

export const pestDiseaseDetailsSchema = z.object({
  pest: z.enum(['varroa', 'shb', 'wax_moths', 'ants', 'wasps', 'nosema', 'afb', 'efb', 'chalkbrood', 'other']),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  location: z.string().optional(),
});

// ============ ACTIONS ============

export const feedingDetailsSchema = z.object({
  feedType: z.string(),
  amount: z.number().positive(),
  unit: z.string(),
  concentration: z.string().optional(),
});

export const frameManipulationDetailsSchema = z.object({
  added: z.number().int().default(0),
  removed: z.number().int().default(0),
});

export const boxConfigDetailsSchema = z.object({
  boxesAdded: z.number().int().default(0),
  boxesRemoved: z.number().int().default(0),
  framesAdded: z.number().int().default(0),
  framesRemoved: z.number().int().default(0),
  totalBoxes: z.number().int().optional(),
  totalFrames: z.number().int().optional(),
});

export const harvestDetailsSchema = z.object({
  frames: z.number().int().optional(),
  weight: z.number().optional(),
  unit: z.string().default('kg'),
});

export const treatmentDetailsSchema = z.object({
  product: z.string(),
  quantity: z.number().optional(),
  unit: z.string(),
  durationDays: z.number().int().optional(),
  action: z.enum(['APPLIED', 'REMOVED', 'CHECKED']).default('APPLIED'),
});

export const noteDetailsSchema = z.object({
  content: z.string().min(1),
});

// ============ TYPE MAPPING ============

export const activityDetailsSchemas = {
  MITE_COUNT: miteCountDetailsSchema,
  QUEEN_STATUS: queenStatusDetailsSchema,
  BROOD: broodDetailsSchema,
  STORES: storesDetailsSchema,
  COLONY_STRENGTH: colonyStrengthDetailsSchema,
  TEMPERAMENT: temperamentDetailsSchema,
  PEST_DISEASE: pestDiseaseDetailsSchema,
  FEEDING: feedingDetailsSchema,
  FRAME_MANIPULATION: frameManipulationDetailsSchema,
  BOX_CONFIGURATION: boxConfigDetailsSchema,
  HARVEST: harvestDetailsSchema,
  TREATMENT: treatmentDetailsSchema,
  NOTE: noteDetailsSchema,
} as const;

export type ActivityDetailsMap = {
  MITE_COUNT: z.infer<typeof miteCountDetailsSchema>;
  QUEEN_STATUS: z.infer<typeof queenStatusDetailsSchema>;
  BROOD: z.infer<typeof broodDetailsSchema>;
  STORES: z.infer<typeof storesDetailsSchema>;
  COLONY_STRENGTH: z.infer<typeof colonyStrengthDetailsSchema>;
  TEMPERAMENT: z.infer<typeof temperamentDetailsSchema>;
  PEST_DISEASE: z.infer<typeof pestDiseaseDetailsSchema>;
  FEEDING: z.infer<typeof feedingDetailsSchema>;
  FRAME_MANIPULATION: z.infer<typeof frameManipulationDetailsSchema>;
  BOX_CONFIGURATION: z.infer<typeof boxConfigDetailsSchema>;
  HARVEST: z.infer<typeof harvestDetailsSchema>;
  TREATMENT: z.infer<typeof treatmentDetailsSchema>;
  NOTE: z.infer<typeof noteDetailsSchema>;
};

// Runtime validator
export function validateActivityDetails<T extends keyof typeof activityDetailsSchemas>(
  type: T,
  details: unknown
): ActivityDetailsMap[T] {
  const schema = activityDetailsSchemas[type];
  return schema.parse(details) as ActivityDetailsMap[T];
}
```

### Inspection Summary Schema

```typescript
// packages/shared-schemas/src/inspection/summary.schema.ts

import { z } from 'zod';

export const inspectionSummarySchema = z.object({
  // Colony metrics
  strength: z.number().int().min(0).max(10).optional(),
  honeyFrames: z.number().int().min(0).optional(),
  pollenFrames: z.number().int().min(0).optional(),
  cappedBroodFrames: z.number().int().min(0).optional(),
  uncappedBroodFrames: z.number().int().min(0).optional(),
  queenCells: z.number().int().min(0).optional(),

  // Mite count
  miteCount: z.number().int().min(0).optional(),
  miteMethod: z.string().optional(),
  infestationRate: z.number().optional(),

  // Flags
  queenSeen: z.boolean().optional(),
  swarmCells: z.boolean().optional(),
  treatmentApplied: z.boolean().optional(),
});

export type InspectionSummary = z.infer<typeof inspectionSummarySchema>;
```

### Task Schema

```typescript
// packages/shared-schemas/src/task/task.schema.ts

import { z } from 'zod';
import { ActivityType } from '../activity/types';

export const createTaskSchema = z.object({
  hiveId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  type: z.nativeEnum(ActivityType).optional(),
  triggerActivityId: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  completedActivityId: z.string().uuid().optional(),
});

export const taskResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  type: z.nativeEnum(ActivityType).nullable(),
  triggerActivityId: z.string().uuid().nullable(),
  completedActivityId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export const taskFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  completed: z.boolean().optional(),
  overdue: z.boolean().optional(),
  type: z.nativeEnum(ActivityType).optional(),
});

export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type TaskFilter = z.infer<typeof taskFilterSchema>;
```

---

## Data Migration Script

```typescript
// apps/backend/src/migrations/migrate-to-hive-activity.ts

import { PrismaClient } from '@prisma/client';
import { ActivityType } from '@hive-pal/shared-schemas';

const prisma = new PrismaClient();

interface MigrationStats {
  actions: { total: number; migrated: number; failed: number };
  observations: { total: number; migrated: number; failed: number };
  inspections: { total: number; summariesCreated: number };
}

async function migrateActions(stats: MigrationStats) {
  console.log('Migrating actions...');

  const actions = await prisma.action.findMany({
    include: {
      feedingAction: true,
      treatmentAction: true,
      frameAction: true,
      harvestAction: true,
      boxConfigurationAction: true,
    },
  });

  stats.actions.total = actions.length;

  for (const action of actions) {
    try {
      let type: ActivityType;
      let details: Record<string, unknown>;

      switch (action.type) {
        case 'FEEDING':
          if (!action.feedingAction) throw new Error('Missing feedingAction');
          type = ActivityType.FEEDING;
          details = {
            feedType: action.feedingAction.feedType,
            amount: action.feedingAction.amount,
            unit: action.feedingAction.unit,
            concentration: action.feedingAction.concentration,
          };
          break;

        case 'TREATMENT':
          if (!action.treatmentAction) throw new Error('Missing treatmentAction');
          type = ActivityType.TREATMENT;
          details = {
            product: action.treatmentAction.product,
            quantity: action.treatmentAction.quantity,
            unit: action.treatmentAction.unit,
            durationDays: parseDuration(action.treatmentAction.duration),
            action: 'APPLIED',
          };
          break;

        case 'FRAME':
          if (!action.frameAction) throw new Error('Missing frameAction');
          type = ActivityType.FRAME_MANIPULATION;
          details = {
            added: action.frameAction.quantity > 0 ? action.frameAction.quantity : 0,
            removed: action.frameAction.quantity < 0 ? Math.abs(action.frameAction.quantity) : 0,
          };
          break;

        case 'HARVEST':
          if (!action.harvestAction) throw new Error('Missing harvestAction');
          type = ActivityType.HARVEST;
          details = {
            weight: action.harvestAction.amount,
            unit: action.harvestAction.unit,
          };
          break;

        case 'BOX_CONFIGURATION':
          if (!action.boxConfigurationAction) throw new Error('Missing boxConfigurationAction');
          type = ActivityType.BOX_CONFIGURATION;
          details = {
            boxesAdded: action.boxConfigurationAction.boxesAdded,
            boxesRemoved: action.boxConfigurationAction.boxesRemoved,
            framesAdded: action.boxConfigurationAction.framesAdded,
            framesRemoved: action.boxConfigurationAction.framesRemoved,
            totalBoxes: action.boxConfigurationAction.totalBoxes,
            totalFrames: action.boxConfigurationAction.totalFrames,
          };
          break;

        case 'NOTE':
          type = ActivityType.NOTE;
          details = { content: action.notes || '' };
          break;

        case 'OTHER':
          type = ActivityType.NOTE;
          details = { content: action.notes || 'Other action' };
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      await prisma.hiveActivity.create({
        data: {
          id: action.id, // Preserve ID for reference integrity
          hiveId: action.hiveId!,
          date: action.date,
          type,
          details,
          notes: action.notes,
          inspectionId: action.inspectionId,
          harvestId: action.harvestId,
          createdAt: action.date,
        },
      });

      // Create follow-up task for treatments with duration
      if (type === ActivityType.TREATMENT && details.durationDays) {
        const dueDate = new Date(action.date);
        dueDate.setDate(dueDate.getDate() + (details.durationDays as number));

        await prisma.task.create({
          data: {
            hiveId: action.hiveId!,
            title: `Remove/check ${details.product}`,
            description: `Follow-up for treatment applied on ${action.date.toISOString().split('T')[0]}`,
            dueDate,
            type: ActivityType.TREATMENT,
            triggerActivityId: action.id,
            // If dueDate is in the past, mark as completed (best effort)
            completedAt: dueDate < new Date() ? dueDate : null,
          },
        });
      }

      stats.actions.migrated++;
    } catch (error) {
      console.error(`Failed to migrate action ${action.id}:`, error);
      stats.actions.failed++;
    }
  }
}

async function migrateObservations(stats: MigrationStats) {
  console.log('Migrating observations...');

  // Group observations by inspection
  const inspections = await prisma.inspection.findMany({
    include: { observations: true },
  });

  for (const inspection of inspections) {
    stats.observations.total += inspection.observations.length;

    // Build summary and individual activities from observations
    const summary: Record<string, unknown> = {};
    const additionalObservations: string[] = [];
    const reminderObservations: string[] = [];

    for (const obs of inspection.observations) {
      try {
        switch (obs.type) {
          case 'strength':
            summary.strength = obs.numericValue;
            await createObservationActivity(inspection, ActivityType.COLONY_STRENGTH, {
              score: obs.numericValue,
            });
            break;

          case 'capped_brood':
            summary.cappedBroodFrames = obs.numericValue;
            break;

          case 'uncapped_brood':
            summary.uncappedBroodFrames = obs.numericValue;
            break;

          case 'honey_stores':
            summary.honeyFrames = obs.numericValue;
            break;

          case 'pollen_stores':
            summary.pollenFrames = obs.numericValue;
            break;

          case 'queen_cells':
            summary.queenCells = obs.numericValue;
            break;

          case 'swarm_cells':
            summary.swarmCells = obs.booleanValue;
            break;

          case 'supersedure_cells':
            // Include in brood activity
            break;

          case 'queen_seen':
            summary.queenSeen = obs.booleanValue;
            await createObservationActivity(inspection, ActivityType.QUEEN_STATUS, {
              seen: obs.booleanValue ?? false,
            });
            break;

          case 'brood_pattern':
            // Will be included in BROOD activity
            break;

          // Additional observations (badges)
          case 'calm':
          case 'defensive':
          case 'aggressive':
          case 'nervous':
            await createObservationActivity(inspection, ActivityType.TEMPERAMENT, {
              temperament: obs.type,
            });
            break;

          case 'varroa_present':
          case 'small_hive_beetle':
          case 'wax_moths':
          case 'ants_present':
            const pestMap: Record<string, string> = {
              varroa_present: 'varroa',
              small_hive_beetle: 'shb',
              wax_moths: 'wax_moths',
              ants_present: 'ants',
            };
            await createObservationActivity(inspection, ActivityType.PEST_DISEASE, {
              pest: pestMap[obs.type] || 'other',
            });
            break;

          // Reminder observations - create tasks
          case 'honey_bound':
          case 'overcrowded':
          case 'needs_super':
          case 'queen_issues':
          case 'requires_treatment':
          case 'low_stores':
          case 'prepare_for_winter':
            reminderObservations.push(obs.type);
            break;
        }

        stats.observations.migrated++;
      } catch (error) {
        console.error(`Failed to migrate observation ${obs.id}:`, error);
        stats.observations.failed++;
      }
    }

    // Create combined BROOD activity if we have brood data
    const hasBroodData = summary.cappedBroodFrames || summary.uncappedBroodFrames ||
                         summary.queenCells || summary.swarmCells;
    if (hasBroodData) {
      const broodPatternObs = inspection.observations.find(o => o.type === 'brood_pattern');
      const supersedureObs = inspection.observations.find(o => o.type === 'supersedure_cells');

      await createObservationActivity(inspection, ActivityType.BROOD, {
        pattern: broodPatternObs?.textValue,
        cappedFrames: summary.cappedBroodFrames,
        uncappedFrames: summary.uncappedBroodFrames,
        queenCells: summary.queenCells,
        swarmCells: summary.swarmCells,
        supersedureCells: supersedureObs?.booleanValue,
      });
    }

    // Create STORES activity if we have stores data
    if (summary.honeyFrames || summary.pollenFrames) {
      await createObservationActivity(inspection, ActivityType.STORES, {
        honeyFrames: summary.honeyFrames,
        pollenFrames: summary.pollenFrames,
      });
    }

    // Update inspection with summary
    await prisma.inspection.update({
      where: { id: inspection.id },
      data: { summary },
    });

    stats.inspections.summariesCreated++;
  }

  stats.inspections.total = inspections.length;
}

async function createObservationActivity(
  inspection: { id: string; hiveId: string; date: Date },
  type: ActivityType,
  details: Record<string, unknown>
) {
  await prisma.hiveActivity.create({
    data: {
      hiveId: inspection.hiveId,
      date: inspection.date,
      type,
      details,
      inspectionId: inspection.id,
      createdAt: inspection.date,
    },
  });
}

function parseDuration(duration: string | null): number | undefined {
  if (!duration) return undefined;

  // Parse strings like "7 days", "14 days", "6 weeks"
  const match = duration.match(/(\d+)\s*(day|week|month)/i);
  if (!match) return undefined;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
    case 'days':
      return value;
    case 'week':
    case 'weeks':
      return value * 7;
    case 'month':
    case 'months':
      return value * 30;
    default:
      return undefined;
  }
}

async function main() {
  console.log('Starting migration to HiveActivity model...\n');

  const stats: MigrationStats = {
    actions: { total: 0, migrated: 0, failed: 0 },
    observations: { total: 0, migrated: 0, failed: 0 },
    inspections: { total: 0, summariesCreated: 0 },
  };

  try {
    await prisma.$transaction(async (tx) => {
      // Note: In real migration, pass tx to all functions
      await migrateActions(stats);
      await migrateObservations(stats);
    }, {
      timeout: 300000, // 5 minutes
    });

    console.log('\n=== Migration Complete ===');
    console.log(`Actions: ${stats.actions.migrated}/${stats.actions.total} migrated, ${stats.actions.failed} failed`);
    console.log(`Observations: ${stats.observations.migrated}/${stats.observations.total} migrated, ${stats.observations.failed} failed`);
    console.log(`Inspections: ${stats.inspections.summariesCreated}/${stats.inspections.total} summaries created`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

---

## Rollback Plan

If issues are found after migration:

1. **Reads switched but problems found**:
   - Switch reads back to old tables (code change + deploy)
   - New tables remain for debugging

2. **Data integrity issues**:
   - Old tables are untouched - no data loss
   - Fix migration script, truncate new tables, re-run

3. **Full rollback**:
   ```sql
   -- Only after confirming no dependencies
   TRUNCATE TABLE "HiveActivity" CASCADE;
   TRUNCATE TABLE "Task" CASCADE;
   -- Remove summary from inspections
   UPDATE "Inspection" SET summary = NULL;
   ```

---

## Tables to Drop (Phase 9)

After confidence period (suggest 2-4 weeks of stable operation):

```sql
-- Backup first!
CREATE TABLE _backup_action AS SELECT * FROM "Action";
CREATE TABLE _backup_treatment_action AS SELECT * FROM "TreatmentAction";
CREATE TABLE _backup_feeding_action AS SELECT * FROM "FeedingAction";
CREATE TABLE _backup_frame_action AS SELECT * FROM "FrameAction";
CREATE TABLE _backup_harvest_action AS SELECT * FROM "HarvestAction";
CREATE TABLE _backup_box_configuration_action AS SELECT * FROM "BoxConfigurationAction";
CREATE TABLE _backup_observation AS SELECT * FROM "Observation";

-- Then drop
DROP TABLE "TreatmentAction";
DROP TABLE "FeedingAction";
DROP TABLE "FrameAction";
DROP TABLE "HarvestAction";
DROP TABLE "BoxConfigurationAction";
DROP TABLE "Observation";
DROP TABLE "Action";
```

---

## Notes & Decisions

| Decision | Rationale |
|----------|-----------|
| Keep treatment follow-ups as Tasks | Separates "what happened" from "what needs to happen" |
| Mite count → treatment link is temporal | Query by date proximity, no FK coupling |
| Inspection summary is denormalized cache | Fast reads for list views, updated on activity changes |
| Task starts hive-scoped | Can add apiaryId later without breaking changes |
| Preserve action IDs during migration | Allows referential integrity checks |

---

## Open Questions

- [ ] Should we migrate `InspectionNote` into `HiveActivity` (type: NOTE) or keep separate?
- [ ] How to handle historical treatments where follow-up already happened but wasn't tracked?
- [ ] Do we need to migrate alerts/reminders that were based on observation badges?

---

*Last updated: [DATE]*
*Migration status: Not started*
