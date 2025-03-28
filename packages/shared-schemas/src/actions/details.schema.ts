import { z } from 'zod';
import { ActionType } from './types';

// Base details schemas for specific action types
export const feedingActionDetailsSchema = z.object({
  type: z.literal(ActionType.FEEDING),
  feedType: z.string(),
  amount: z.number().positive(),
  unit: z.string(),
  concentration: z.string().optional(),
});

export const treatmentActionDetailsSchema = z.object({
  type: z.literal(ActionType.TREATMENT),
  product: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  duration: z.string().optional(),
});

export const frameActionDetailsSchema = z.object({
  type: z.literal(ActionType.FRAME),
  quantity: z.number().int(),
});

export const otherActionDetailsSchema = z.object({
  type: z.literal(ActionType.OTHER),
});

// Combined details schema using discriminated union
export const actionDetailsSchema = z.discriminatedUnion('type', [
  feedingActionDetailsSchema,
  treatmentActionDetailsSchema,
  frameActionDetailsSchema,
  otherActionDetailsSchema,
]);

export type FeedingActionDetails = z.infer<typeof feedingActionDetailsSchema>;
export type TreatmentActionDetails = z.infer<typeof treatmentActionDetailsSchema>;
export type FrameActionDetails = z.infer<typeof frameActionDetailsSchema>;
export type OtherActionDetails = z.infer<typeof otherActionDetailsSchema>;
export type ActionDetails = z.infer<typeof actionDetailsSchema>;
