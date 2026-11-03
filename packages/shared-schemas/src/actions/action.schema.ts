import { z } from 'zod';
import { isoDateTime } from '../utils/datetime';
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
  hiveId: z.uuid(),
  date: isoDateTime().optional(),
});

// Response schema for actions (with IDs)
export const actionResponseSchema = createActionSchema.extend({
  id: z.uuid(),
  hiveId: z.uuid().nullable(),
  inspectionId: z.uuid().nullable(),
  harvestId: z.uuid().nullable(),
  date: z.iso.datetime(),
  createdByUserName: z.string().nullish(),
});

// Filter schema for actions
export const actionFilterSchema = z.object({
  hiveId: z.uuid().optional(),
  type: actionTypeSchema.optional(),
  startDate: isoDateTime().optional(),
  endDate: isoDateTime().optional(),
});

// Update schema for actions (partial, hiveId cannot be changed)
export const updateActionSchema = createStandaloneActionSchema
  .partial()
  .omit({ hiveId: true });

export type CreateAction = z.infer<typeof createActionSchema>;
export type CreateStandaloneAction = z.infer<
  typeof createStandaloneActionSchema
>;
export type UpdateAction = z.infer<typeof updateActionSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
export type ActionFilter = z.infer<typeof actionFilterSchema>;
