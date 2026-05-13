import { z } from 'zod';
import {
  createInspectionSchema,
  ActionType,
  observationBaseSchema,
} from 'shared-schemas';
import type { Box } from 'shared-schemas';

// Frontend-specific modifications for the form
// We use date object instead of datetime string
const inspectionFormSchema = createInspectionSchema
  .omit({ date: true })
  .extend({
    date: z.date().or(z.string().transform(v => new Date(v))),
    isAllDay: z.boolean().optional().default(true),
  });

// Action schema modifications for the frontend
// Feeding action
export const feedingActionSchema = z.object({
  type: z.literal(ActionType.FEEDING),
  feedType: z.string().min(1),
  quantity: z.number(),
  unit: z.string(),
  concentration: z.string().optional(),
  notes: z.string().optional(),
});

// Treatment action
export const treatmentActionSchema = z.object({
  type: z.literal(ActionType.TREATMENT),
  treatmentType: z.string(),
  amount: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
});

// Frames action
export const framesActionSchema = z.object({
  type: z.literal(ActionType.FRAME),
  frames: z.number(),
  notes: z.string().optional(),
});

// Note action
export const noteActionSchema = z.object({
  type: z.literal(ActionType.NOTE),
  notes: z.string(),
});

// Maintenance action
export const maintenanceActionSchema = z.object({
  type: z.literal(ActionType.MAINTENANCE),
  component: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
});

// Other action
export const otherActionSchema = z.object({
  type: z.literal(ActionType.OTHER),
  notes: z.string(),
});

// Box configuration action
export const boxConfigurationActionSchema = z.object({
  type: z.literal(ActionType.BOX_CONFIGURATION),
  boxesAdded: z.number().min(0),
  boxesRemoved: z.number().min(0),
  framesAdded: z.number().min(0),
  framesRemoved: z.number().min(0),
  totalBoxes: z.number().min(0),
  totalFrames: z.number().min(0),
  boxesSummary: z
    .array(
      z.object({
        type: z.string(),
        frameCount: z.number().int().min(0),
      }),
    )
    .optional(),
  // Local-only: carry the updated boxes so the form can re-derive totalFrames
  updatedBoxes: z.custom<Box[]>().optional(),
});

// Combined action schema
export const actionSchema = z.discriminatedUnion('type', [
  feedingActionSchema,
  treatmentActionSchema,
  framesActionSchema,
  maintenanceActionSchema,
  noteActionSchema,
  otherActionSchema,
  boxConfigurationActionSchema,
]);

// Score override schema for the form
export const scoreFormSchema = z.object({
  overallScore: z.number().min(0).max(10).nullable().optional(),
  populationScore: z.number().min(0).max(10).nullable().optional(),
  storesScore: z.number().min(0).max(10).nullable().optional(),
  queenScore: z.number().min(0).max(10).nullable().optional(),
});

// Schema used when the apiary is in subjective mode — strength is capped at 10
// (in data-driven mode strength is a frame count with no upper bound).
export const subjectiveInspectionSchema = inspectionFormSchema.extend({
  actions: z.array(actionSchema).optional(),
  score: scoreFormSchema.optional(),
  observations: observationBaseSchema
    .extend({
      strength: z.number().int().min(0).max(10).nullish(),
    })
    .optional(),
});

// Final inspection schema
export const inspectionSchema = inspectionFormSchema.extend({
  actions: z.array(actionSchema).optional(),
  score: scoreFormSchema.optional(),
});

export type ObservationFormData = z.infer<typeof observationBaseSchema>;
export type FeedingActionData = z.infer<typeof feedingActionSchema>;
export type TreatmentActionData = z.infer<typeof treatmentActionSchema>;
export type FramesActionData = z.infer<typeof framesActionSchema>;
export type MaintenanceActionData = z.infer<typeof maintenanceActionSchema>;
export type NoteActionData = z.infer<typeof noteActionSchema>;
export type BoxConfigurationActionData = z.infer<typeof boxConfigurationActionSchema>;
export type ActionData = z.infer<typeof actionSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
