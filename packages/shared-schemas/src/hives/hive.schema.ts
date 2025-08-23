import { z } from 'zod';
import { hiveStatusSchema } from './status';
import { boxSchema } from './box.schema';
import {activeQueenSchema} from "../queens";

// Base schema for creating hives
export const createHiveSchema = z.object({
  name: z.string(),
  apiaryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  installationDate: z.date().optional().or(z.string().datetime().optional()),
  status: hiveStatusSchema.optional(),
  positionRow: z.number().int().min(0).optional(),
  positionCol: z.number().int().min(0).optional(),
});

export const createHiveResponseSchema = z.object({
  id: z.string().uuid(),
  status: hiveStatusSchema,
})

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
})

export const hiveScoreSchema = z.object({
  overallScore: z.number().nullish(),
  populationScore: z.number().nullish(),
  storesScore: z.number().nullish(),
  queenScore: z.number().nullish(),

  warnings: z.array(z.string()),
  confidence: z.number(),
})
// Schema for detailed hive response
export const hiveDetailResponseSchema = createHiveSchema.extend({
  id: z.string().uuid(),
  status: hiveStatusSchema,
  boxes: z.array(boxSchema),
  hiveScore: hiveScoreSchema,
  activeQueen: activeQueenSchema.nullish(),
  lastInspectionDate: z.string().datetime().or(z.date()).optional(),
});



// Schema for basic hive response
export const hiveResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: hiveStatusSchema,
  apiaryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  installationDate: z.string().datetime().optional(),
  lastInspectionDate: z.string().datetime().optional() ,
  activeQueen: activeQueenSchema.nullish(),
  positionRow: z.number().int().min(0).optional(),
  positionCol: z.number().int().min(0).optional(),
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

export type CreateHive = z.infer<typeof createHiveSchema>;
export type CreateHiveResponse = z.infer<typeof createHiveResponseSchema>;
export type UpdateHive = z.infer<typeof updateHiveSchema>;
export type UpdateHiveResponse = z.infer<typeof updateHiveResponseSchema>;
export type HiveDetailResponse = z.infer<typeof hiveDetailResponseSchema>;
export type HiveResponse = z.infer<typeof hiveResponseSchema>;
export type HiveWithBoxesResponse = z.infer<typeof hiveWithBoxesResponseSchema>;
export type HiveScore = z.infer<typeof hiveScoreSchema>;
export type HiveFilter = z.infer<typeof hiveFilterSchema>;