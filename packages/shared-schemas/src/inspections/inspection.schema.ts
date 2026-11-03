import { z } from 'zod';
import { isoDateTime } from '../utils/datetime';
import { observationSchema } from './observations.schema';
import { inspectionStatusSchema } from './status';
import { actionResponseSchema, createActionSchema } from '../actions';
import {
  weightReadingSchema,
  weightReadingResponseSchema,
} from '../measurements/measurement.schema';

export const scoreOverrideSchema = z.object({
  overallScore: z.number().min(0).max(10).nullable(),
  populationScore: z.number().min(0).max(10).nullable(),
  storesScore: z.number().min(0).max(10).nullable(),
  queenScore: z.number().min(0).max(10).nullable(),
});

export type ScoreOverride = z.infer<typeof scoreOverrideSchema>;

// Base schema for creating inspections
export const createInspectionSchema = z.object({
  id: z.uuid().optional(),
  hiveId: z.uuid(),
  date: isoDateTime(),
  isAllDay: z.boolean().optional(),
  temperature: z.number().nullish(),
  weatherConditions: z.string().nullish(),
  notes: z.string().nullish(),
  observations: observationSchema.optional(),
  actions: z.array(createActionSchema).optional(),
  weights: z.array(weightReadingSchema).optional(),
  status: inspectionStatusSchema.optional(),
  score: scoreOverrideSchema.optional(),
});

// Schema for updating inspections
export const updateInspectionSchema = createInspectionSchema.partial().extend({
  status: inspectionStatusSchema.optional(),
});

export const updateInspectionResponseSchema = z.object({
  id: z.uuid(),
  status: inspectionStatusSchema.optional(),
  date: z.iso.datetime(),
  hiveId: z.uuid(),
  isAllDay: z.boolean().optional(),
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
  hiveId: z.uuid(),
  status: inspectionStatusSchema,
  date: z.iso.datetime(),
  isAllDay: z.boolean().optional(),
  id: z.uuid(),
});

// Schema for inspection responses
export const inspectionResponseSchema = createInspectionSchema.extend({
  id: z.uuid(),
  status: inspectionStatusSchema,
  date: z
    .date()
    .transform(d => d.toISOString())
    .or(z.iso.datetime()),
  score: scoreSchema.optional(),
  actions: z.array(actionResponseSchema),
  weights: z.array(weightReadingResponseSchema).optional(),
  createdByUserName: z.string().nullish(),
});

// Schema for filtering inspections
export const inspectionFilterSchema = z.object({
  hiveId: z.uuid().optional(),
  startDate: isoDateTime().optional(),
  endDate: isoDateTime().optional(),
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
