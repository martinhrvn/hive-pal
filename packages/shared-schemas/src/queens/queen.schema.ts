import { z } from 'zod';
import { queenMatingTypeSchema, queenStatusSchema } from './status';

const dateInputSchema = z
  .string()
  .datetime()
  .optional()
  .or(z.date().optional())
  .nullable();

// Trait ratings are 1-5 where higher is always better
const traitRatingSchema = z.number().int().min(1).max(5).nullish();

export const QUEEN_TRAITS = [
  'gentleness',
  'hygiene',
  'swarmResistance',
  'honeyProduction',
] as const;

export type QueenTrait = (typeof QUEEN_TRAITS)[number];

// Base schema for creating queens
export const createQueenSchema = z.object({
  hiveId: z.string().uuid().optional().nullable(),
  name: z.string().optional().nullable(),
  marking: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  year: z.number().nullable(),
  source: z.string().optional().nullable(),
  status: queenStatusSchema.optional().nullable(),
  installedAt: dateInputSchema,
  replacedAt: dateInputSchema,
  cellCappedAt: dateInputSchema,
  emergedAt: dateInputSchema,
  notes: z.string().max(5000).nullish(),
  breeder: z.string().max(200).nullish(),
  line: z.string().max(200).nullish(),
  motherQueenId: z.string().uuid().nullish(),
  matingType: queenMatingTypeSchema.nullish(),
  matingStation: z.string().max(200).nullish(),
  matedAt: dateInputSchema,
  gentleness: traitRatingSchema,
  hygiene: traitRatingSchema,
  swarmResistance: traitRatingSchema,
  honeyProduction: traitRatingSchema,
});

// Schema for updating queens
export const updateQueenSchema = createQueenSchema.partial();

// Minimal reference to another queen (mother / daughters)
export const queenRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  year: z.number().nullable(),
  color: z.string().nullable(),
  status: queenStatusSchema,
});

// Schema for queen response
export const queenResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().optional().nullable(),
  name: z.string().optional().nullable(),
  hiveName: z.string().optional().nullable(),
  marking: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  year: z.number().nullable(),
  source: z.string().optional().nullable(),
  status: queenStatusSchema.nullable(),
  installedAt: z.string().datetime().optional().nullable(),
  replacedAt: z.string().datetime().optional().nullable(),
  cellCappedAt: z.string().datetime().nullish(),
  emergedAt: z.string().datetime().nullish(),
  statusChangedAt: z.string().datetime().nullish(),
  // Apiary of the queen's current hive (null for a queen not in a hive).
  apiaryId: z.string().uuid().optional().nullable(),
  apiaryName: z.string().optional().nullable(),
  notes: z.string().nullish(),
  breeder: z.string().nullish(),
  line: z.string().nullish(),
  motherQueenId: z.string().uuid().nullish(),
  matingType: queenMatingTypeSchema.nullish(),
  matingStation: z.string().nullish(),
  matedAt: z.string().datetime().nullish(),
  gentleness: z.number().nullish(),
  hygiene: z.number().nullish(),
  swarmResistance: z.number().nullish(),
  honeyProduction: z.number().nullish(),
});

export const activeQueenSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().optional(),
  year: z.number().nullish(),
  marking: z.string().nullish(),
  installedAt: z.string().datetime().optional().or(z.date()).nullable(),
  color: z.string().nullish(),
  status: queenStatusSchema.nullish(),
  source: z.string().nullish(),
});

export const queenMovementSchema = z.object({
  id: z.string().uuid(),
  queenId: z.string().uuid(),
  fromHiveId: z.string().uuid().nullable(),
  fromHiveName: z.string().nullable(),
  toHiveId: z.string().uuid().nullable(),
  toHiveName: z.string().nullable(),
  movedAt: z.string().datetime(),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
});

export const recordQueenTransferSchema = z.object({
  toHiveId: z.string().uuid().nullable(),
  movedAt: z.string().datetime().optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const queenDetailSchema = queenResponseSchema.extend({
  name: z.string().nullable().optional(),
  hiveName: z.string().nullable().optional(),
  movements: z.array(queenMovementSchema),
  // Only set when the mother is visible to the current user
  motherQueen: queenRefSchema.nullable(),
  daughters: z.array(queenRefSchema),
});

export type ActiveQueen = z.infer<typeof activeQueenSchema>;

export type CreateQueen = z.infer<typeof createQueenSchema>;
export type UpdateQueen = z.infer<typeof updateQueenSchema>;
export type QueenRef = z.infer<typeof queenRefSchema>;
export type QueenResponse = z.infer<typeof queenResponseSchema>;
export type QueenMovement = z.infer<typeof queenMovementSchema>;
export type RecordQueenTransfer = z.infer<typeof recordQueenTransferSchema>;
export type QueenDetail = z.infer<typeof queenDetailSchema>;
