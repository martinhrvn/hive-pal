import { z } from 'zod';
import { observationSchema } from './observations.schema';
import { inspectionStatusSchema } from './status';
import {actionResponseSchema, createActionSchema} from '../actions';

// Base schema for creating inspections
export const createInspectionSchema = z.object({
  id: z.string().uuid().optional(),
  hiveId: z.string().uuid(),
  date: z.string().datetime(),
  temperature: z.number().nullish(),
  weatherConditions: z.string().nullish(),
  notes: z.string().nullish(),
  observations: observationSchema.optional(),
  actions: z.array(createActionSchema).optional(),
  status: inspectionStatusSchema.optional(),
});

// Schema for updating inspections
export const updateInspectionSchema = createInspectionSchema.partial().extend({
  status: inspectionStatusSchema.optional(),
});

export const updateInspectionResponseSchema = z.object({
  id: z.string().uuid(),
  status: inspectionStatusSchema.optional(),
  date: z.string().datetime(),
  hiveId: z.string().uuid(),
});

export const scoreSchema = z.object({
  overallScore: z.number().nullable(),
  populationScore: z.number().nullable(),
  storesScore: z.number().nullable(),
  queenScore: z.number().nullable(),
  warnings: z.array(z.string()),
  confidence: z.number(),
});

export const createInsectionResponseSchema = z.object({
  hiveId: z.string().uuid(),
  status: inspectionStatusSchema,
  date: z.string().datetime(),
  id: z.string().uuid(),
});

// Schema for inspection responses
export const inspectionResponseSchema = createInspectionSchema.extend({
  id: z.string().uuid(),
  status: inspectionStatusSchema,
  date: z
    .date()
    .transform(d => d.toISOString())
    .or(z.string().datetime()),
  score: scoreSchema.optional(),
  actions: z.array(actionResponseSchema),
});

// Schema for filtering inspections
export const inspectionFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: inspectionStatusSchema.optional(),
});

export type CreateInspection = z.infer<typeof createInspectionSchema>;
export type CreateInspectionResponse = z.infer<
  typeof createInsectionResponseSchema
>;
export type UpdateInspectionResponse = z.infer<
  typeof updateInspectionResponseSchema
>;
export type UpdateInspection = z.infer<typeof updateInspectionSchema>;
export type InspectionResponse = z.infer<typeof inspectionResponseSchema>;
export type InspectionFilter = z.infer<typeof inspectionFilterSchema>;
