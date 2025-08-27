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

export const harvestActionDetailsSchema = z.object({
  type: z.literal(ActionType.HARVEST),
  amount: z.number().min(0),
  unit: z.string().default('kg'),
});

export const boxConfigurationActionDetailsSchema = z.object({
  type: z.literal(ActionType.BOX_CONFIGURATION),
  boxesAdded: z.number().min(0),
  boxesRemoved: z.number().min(0),
  framesAdded: z.number().min(0),
  framesRemoved: z.number().min(0),
  totalBoxes: z.number().min(0),
  totalFrames: z.number().min(0),
});

export const noteActionDetailsSchema = z.object({
  type: z.literal(ActionType.NOTE),
  content: z.string().min(1),
});

export const otherActionDetailsSchema = z.object({
  type: z.literal(ActionType.OTHER),
});

// Combined details schema using discriminated union
export const actionDetailsSchema = z.discriminatedUnion('type', [
  feedingActionDetailsSchema,
  treatmentActionDetailsSchema,
  frameActionDetailsSchema,
  harvestActionDetailsSchema,
  boxConfigurationActionDetailsSchema,
  noteActionDetailsSchema,
  otherActionDetailsSchema,
]);

export type FeedingActionDetails = z.infer<typeof feedingActionDetailsSchema>;
export type TreatmentActionDetails = z.infer<typeof treatmentActionDetailsSchema>;
export type FrameActionDetails = z.infer<typeof frameActionDetailsSchema>;
export type HarvestActionDetails = z.infer<typeof harvestActionDetailsSchema>;
export type BoxConfigurationActionDetails = z.infer<typeof boxConfigurationActionDetailsSchema>;
export type NoteActionDetails = z.infer<typeof noteActionDetailsSchema>;
export type OtherActionDetails = z.infer<typeof otherActionDetailsSchema>;
export type ActionDetails = z.infer<typeof actionDetailsSchema>;
