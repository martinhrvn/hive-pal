import { z } from 'zod';
import { queenStatusSchema } from './status';

// Base schema for creating queens
export const createQueenSchema = z.object({
  hiveId: z.string().uuid().optional().nullable(),
  name: z.string().optional().nullable(),
  marking: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  year: z.number().nullable(),
  source: z.string().optional().nullable(),
  status: queenStatusSchema.optional().nullable(),
  installedAt: z.string().datetime().optional().or(z.date().optional()).nullable(),
  replacedAt: z.string().datetime().optional().or(z.date().optional()).nullable(),
});

// Schema for updating queens
export const updateQueenSchema = createQueenSchema.partial();

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
  // Apiary of the queen's current hive (null for a queen not in a hive).
  apiaryId: z.string().uuid().optional().nullable(),
  apiaryName: z.string().optional().nullable(),
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
});

export type ActiveQueen = z.infer<typeof activeQueenSchema>;

export type CreateQueen = z.infer<typeof createQueenSchema>;
export type UpdateQueen = z.infer<typeof updateQueenSchema>;
export type QueenResponse = z.infer<typeof queenResponseSchema>;
export type QueenMovement = z.infer<typeof queenMovementSchema>;
export type RecordQueenTransfer = z.infer<typeof recordQueenTransferSchema>;
export type QueenDetail = z.infer<typeof queenDetailSchema>;
