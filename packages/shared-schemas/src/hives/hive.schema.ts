import { z } from 'zod';
import { hiveStatusSchema } from './status';
import { boxSchema } from './box.schema';
import { activeQueenSchema } from '../queens';
import { alertResponseSchema } from '../alerts';
import { inspectionTypeEnum } from '../apiaries';
import { queenDispositionSchema } from '../actions/details.schema';

// Schema for hive settings
export const hiveSettingsSchema = z.object({
  autumnFeeding: z.object({
    startMonth: z.number().int().min(1).max(12).default(8),
    endMonth: z.number().int().min(1).max(12).default(10),
    amountKg: z.number().positive().default(12),
  }).optional(),
  inspection: z.object({
    frequencyDays: z.number().int().positive().default(7),
    calendarEnabled: z.boolean().default(true),
  }).optional(),
}).optional();

// Base schema for creating hives
export const createHiveSchema = z.object({
  name: z.string(),
  apiaryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  installationDate: z.date().optional().or(z.string().datetime().optional()),
  status: hiveStatusSchema.optional(),
  positionRow: z.number().int().min(0).optional(),
  positionCol: z.number().int().min(0).optional(),
  settings: hiveSettingsSchema,
  boxes: z.array(boxSchema).optional(),
  featurePhotoId: z.string().uuid().nullish(),
});

export const createHiveResponseSchema = z.object({
  id: z.string().uuid(),
  status: hiveStatusSchema,
});

// Schema for updating hives
export const updateHiveSchema = createHiveSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateHiveResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  apiaryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  installationDate: z.string().datetime().or(z.date()).optional(),
  status: hiveStatusSchema.optional(),
  positionRow: z.number().int().min(0).optional(),
  positionCol: z.number().int().min(0).optional(),
  settings: hiveSettingsSchema,
  featurePhotoId: z.string().uuid().nullish(),
  featurePhotoUrl: z.string().nullish(),
  updatedAt: z.string().datetime(),
});

export const hiveScoreSchema = z.object({
  overallScore: z.number().nullish(),
  populationScore: z.number().nullish(),
  storesScore: z.number().nullish(),
  queenScore: z.number().nullish(),

  warnings: z.array(z.string()),
  confidence: z.number(),
});
// Lightweight reference to a related hive, used for split provenance links
// (the mother a hive was split from, and the offspring split off from it).
export const hiveProvenanceRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: hiveStatusSchema,
});

// Schema for detailed hive response
export const hiveDetailResponseSchema = createHiveSchema.extend({
  id: z.string().uuid(),
  status: hiveStatusSchema,
  boxes: z.array(boxSchema),
  hiveScore: hiveScoreSchema.nullish(),
  activeQueen: activeQueenSchema.nullish(),
  lastInspectionDate: z.string().datetime().or(z.date()).optional(),
  settings: hiveSettingsSchema,
  alerts: z.array(alertResponseSchema).default([]),
  featurePhotoUrl: z.string().nullish(),
  inspectionType: inspectionTypeEnum.optional(),
  updatedAt: z.string().datetime(),
  // Split provenance (optional origin marker, not biological lineage).
  parentHiveId: z.string().uuid().nullish(),
  parentHive: hiveProvenanceRefSchema.nullish(),
  offspring: z.array(hiveProvenanceRefSchema).default([]),
});

// Schema for basic hive response
export const hiveResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: hiveStatusSchema,
  apiaryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  installationDate: z.string().datetime().optional(),
  lastInspectionDate: z.string().datetime().optional(),
  lastInspectionStrength: z.number().nullish(),
  lastInspectionTotalFrames: z.number().nullish(),
  lastInspectionOverallScore: z.number().nullish(),
  previousInspectionStrength: z.number().nullish(),
  lastInspectionWarnings: z.array(z.string()).default([]),
  activeQueen: activeQueenSchema.nullish(),
  positionRow: z.number().int().min(0).optional(),
  positionCol: z.number().int().min(0).optional(),
  boxes: z.array(boxSchema).optional(),
  settings: hiveSettingsSchema,
  alerts: z.array(alertResponseSchema).default([]),
  featurePhotoId: z.string().uuid().nullish(),
  featurePhotoUrl: z.string().nullish(),
  updatedAt: z.string().datetime(),
});

// Schema for hive response with boxes (for apiary layout)
export const hiveWithBoxesResponseSchema = hiveResponseSchema.extend({
  boxes: z.array(boxSchema),
});

// Schema for filtering hives
export const hiveFilterSchema = z.object({
  apiaryId: z.string().uuid().optional(),
  status: hiveStatusSchema.optional(),
  includeInactive: z.boolean().optional(),
  includeBoxes: z.boolean().optional(),
});

export type HiveSettings = z.infer<typeof hiveSettingsSchema>;
export type CreateHive = z.infer<typeof createHiveSchema>;
export type CreateHiveResponse = z.infer<typeof createHiveResponseSchema>;
export type UpdateHive = z.infer<typeof updateHiveSchema>;
export type UpdateHiveResponse = z.infer<typeof updateHiveResponseSchema>;
export type HiveDetailResponse = z.infer<typeof hiveDetailResponseSchema>;
export type HiveProvenanceRef = z.infer<typeof hiveProvenanceRefSchema>;
export type HiveResponse = z.infer<typeof hiveResponseSchema>;
export type HiveWithBoxesResponse = z.infer<typeof hiveWithBoxesResponseSchema>;
export type HiveScore = z.infer<typeof hiveScoreSchema>;
export type HiveFilter = z.infer<typeof hiveFilterSchema>;

// ─── Colony split (Volksteilung / Ableger) ──────────────────────────────────
// v1: a "normal Ableger" — move X brood frames from a source hive into a new
// hive. The old queen either stays with the source (daughter queenless) or moves
// to the new hive (source queenless). A follow-up reminder is created for the
// queenless side. See docs/research/colony-split.
export const splitHiveSchema = z.object({
  date: z.string().datetime(),
  newHiveName: z.string().min(1),
  apiaryId: z.string().uuid().optional(), // default = source hive's apiary
  framesMoved: z
    .array(
      z.object({
        boxId: z.string().uuid(), // a BROOD box of the source hive
        count: z.number().int().min(1),
      }),
    )
    .min(1),
  // Only STAYED_WITH_SOURCE / MOVED_TO_NEW are offered in v1.
  queenDisposition: queenDispositionSchema,
  queenId: z.string().uuid().optional(), // optional; auto-resolved for MOVED_TO_NEW
  // Days until the follow-up reminder for the queenless side (server default if omitted).
  followUpDays: z.number().int().min(0).nullish(),
  notes: z.string().optional(),
});

export const splitHiveResponseSchema = z.object({
  splitId: z.string().uuid(),
  sourceHiveId: z.string().uuid(),
  newHiveId: z.string().uuid(),
});

export type SplitHive = z.infer<typeof splitHiveSchema>;
export type SplitHiveResponse = z.infer<typeof splitHiveResponseSchema>;
