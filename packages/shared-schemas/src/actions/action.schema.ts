import { z } from 'zod';
import { actionDetailsSchema } from './details.schema';
import { actionTypeSchema } from './types';

// Base schema for all actions
export const baseActionSchema = z.object({
  notes: z.string().optional(),
});

// Create schema for actions (without IDs)
export const createActionSchema = baseActionSchema.extend({
  type: actionTypeSchema,
  details: actionDetailsSchema,
});

// Create schema for standalone actions (not tied to inspection)
export const createStandaloneActionSchema = createActionSchema.extend({
  hiveId: z.string().uuid(),
  date: z.string().datetime().optional(),
});

// Response schema for actions (with IDs)
export const actionResponseSchema = createActionSchema.extend({
  id: z.string().uuid(),
  hiveId: z.string().uuid(),
  inspectionId: z.string().uuid().nullable(),
  date: z.string().datetime(),
});

// Filter schema for actions
export const actionFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  type: actionTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateAction = z.infer<typeof createActionSchema>;
export type CreateStandaloneAction = z.infer<typeof createStandaloneActionSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
export type ActionFilter = z.infer<typeof actionFilterSchema>;
