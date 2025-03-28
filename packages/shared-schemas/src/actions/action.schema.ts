import { z } from 'zod';
import { actionDetailsSchema } from './details.schema';
import { ActionType, actionTypeSchema } from './types';

// Base schema for all actions
export const baseActionSchema = z.object({
  notes: z.string().optional(),
});

// Create schema for actions (without IDs)
export const createActionSchema = baseActionSchema.extend({
  type: actionTypeSchema,
  details: actionDetailsSchema,
});

// Response schema for actions (with IDs)
export const actionResponseSchema = createActionSchema.extend({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
});

export type CreateAction = z.infer<typeof createActionSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
