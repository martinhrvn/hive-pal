import { z } from 'zod';
import { queenStatusSchema } from './status';

// Base schema for creating queens
export const createQueenSchema = z.object({
  hiveId: z.string().uuid().optional().nullable(),
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
  marking: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  year: z.number().nullable(),
  source: z.string().optional().nullable(),
  status: queenStatusSchema.nullable(),
  installedAt: z.string().datetime().optional().nullable(),
  replacedAt: z.string().datetime().optional().nullable(),
});

export const activeQueenSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().optional(),
  year: z.number().nullish(),
  marking: z.string().nullish(),
  installedAt: z.string().datetime().optional().or(z.date()).nullable(),
  color: z.string().nullish(),
  status: queenStatusSchema.nullish()
})

export type ActiveQueen = z.infer<typeof activeQueenSchema>;

export type CreateQueen = z.infer<typeof createQueenSchema>;
export type UpdateQueen = z.infer<typeof updateQueenSchema>;
export type QueenResponse = z.infer<typeof queenResponseSchema>;