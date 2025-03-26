import { z } from 'zod';
import { InspectionStatus } from 'api-client';

export const observationSchema = z.object({
  strength: z.number().nullish(),
  uncappedBrood: z.number().nullish(),
  cappedBrood: z.number().nullish(),
  honeyStores: z.number().nullish(),
  pollenStores: z.number().nullish(),
  queenCells: z.number().nullish(),
  swarmCells: z.boolean().nullish(),
  supersedureCells: z.boolean().nullish(),
  queenSeen: z.boolean().nullish(),
});

// Action schemas
export const feedingActionSchema = z.object({
  type: z.literal('FEEDING'),
  feedType: z.enum(['SYRUP', 'HONEY', 'CANDY']),
  quantity: z.number(),
  unit: z.string(),
  concentration: z.string().optional(),
  notes: z.string().optional(),
});

export const treatmentActionSchema = z.object({
  type: z.literal('TREATMENT'),
  treatmentType: z.string(),
  amount: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
});

export const framesActionSchema = z.object({
  type: z.literal('FRAMES'),
  frames: z.number(),
  notes: z.string().optional(),
});

export const otherActionSchema = z.object({
  type: z.literal('OTHER'),
  notes: z.string(),
});

export const actionSchema = z.discriminatedUnion('type', [
  feedingActionSchema,
  treatmentActionSchema,
  framesActionSchema,
  otherActionSchema,
]);

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().nullish(),
  weatherConditions: z.string().nullish(),
  observations: observationSchema,
  notes: z.string().nullish(),
  status: z.nativeEnum(InspectionStatus),
  actions: z.array(actionSchema).optional(),
});

export type ObservationFormData = z.infer<typeof observationSchema>;
export type FeedingActionData = z.infer<typeof feedingActionSchema>;
export type TreatmentActionData = z.infer<typeof treatmentActionSchema>;
export type FramesActionData = z.infer<typeof framesActionSchema>;
export type ActionData = z.infer<typeof actionSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
