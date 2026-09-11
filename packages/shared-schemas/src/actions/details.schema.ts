import { z } from 'zod';
import { ActionType } from './types';
import { boxTypeSchema } from '../hives/box.schema';

// Treatment product configuration with default units and quantity requirements
export const TREATMENT_PRODUCTS = {
  OXALIC_ACID: { label: 'Oxalic Acid', defaultUnit: 'ml', requiresQuantity: true },
  FORMIC_ACID: { label: 'Formic Acid', defaultUnit: 'ml', requiresQuantity: true },
  THYMOL: { label: 'Thymol', defaultUnit: 'g', requiresQuantity: true },
  APIVAR: { label: 'Apivar', defaultUnit: 'pcs', requiresQuantity: true },
  APISTAN: { label: 'Apistan', defaultUnit: 'pcs', requiresQuantity: true },
  CHECKMITE_PLUS: { label: 'CheckMite+', defaultUnit: 'pcs', requiresQuantity: true },
  HOPGUARD: { label: 'HopGuard', defaultUnit: 'pcs', requiresQuantity: true },
  API_BIOXAL: { label: 'Api-Bioxal', defaultUnit: 'g', requiresQuantity: true },
  APIGUARD: { label: 'Apiguard', defaultUnit: 'g', requiresQuantity: true },
  MAQS: { label: 'MAQS', defaultUnit: 'pcs', requiresQuantity: true },
  FUMIGATION: { label: 'Fumigation', defaultUnit: 'pcs', requiresQuantity: false },
  OTHER: { label: 'Other', defaultUnit: 'pcs', requiresQuantity: true },
} as const;

export type TreatmentProductId = keyof typeof TREATMENT_PRODUCTS;

export const TREATMENT_UNITS = ['ml', 'g', 'pcs'] as const;
export type TreatmentUnit = (typeof TREATMENT_UNITS)[number];

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
  quantity: z.number().positive().optional().nullable(),
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
  unit: z.string(),
});

export const boxConfigurationActionDetailsSchema = z.object({
  type: z.literal(ActionType.BOX_CONFIGURATION),
  boxesAdded: z.number().min(0),
  boxesRemoved: z.number().min(0),
  framesAdded: z.number().min(0),
  framesRemoved: z.number().min(0),
  totalBoxes: z.number().min(0),
  totalFrames: z.number().min(0),
  /** Per-box summary of the resulting hive configuration */
  boxes: z.array(z.object({
    type: boxTypeSchema,
    frameCount: z.number().int().min(0),
  })).optional(),
});

export const maintenanceComponentSchema = z.enum(['BOX', 'BOTTOM_BOARD', 'COVER']);
export const maintenanceStatusSchema = z.enum(['CLEANED', 'REPLACED']);

export const maintenanceActionDetailsSchema = z.object({
  type: z.literal(ActionType.MAINTENANCE),
  component: maintenanceComponentSchema,
  status: maintenanceStatusSchema,
});

export const noteActionDetailsSchema = z.object({
  type: z.literal(ActionType.NOTE),
  content: z.string().min(1),
});

export const splitRoleSchema = z.enum(['SOURCE', 'NEW']);
export const queenDispositionSchema = z.enum([
  'STAYED_WITH_SOURCE', // old queen remains in the mother; daughter is queenless
  'MOVED_TO_NEW', // old queen goes to the daughter; mother is queenless
  'NEW_IS_QUEENLESS', // daughter starts queenless (mother keeps its queen)
]);

// Colony split (Ableger) details. A split is written as a matched PAIR of SPLIT
// actions sharing a `splitId` (one on the source hive, one on the new hive).
// `splitId`/`role`/`counterpartHiveId` are set by the backend and present on
// responses; they are optional on input.
export const splitActionDetailsSchema = z.object({
  type: z.literal(ActionType.SPLIT),
  splitId: z.string().uuid().optional(),
  role: splitRoleSchema.optional(),
  counterpartHiveId: z.string().uuid().nullish(),
  framesMoved: z.number().int().min(0),
  queenDisposition: queenDispositionSchema,
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
  maintenanceActionDetailsSchema,
  noteActionDetailsSchema,
  splitActionDetailsSchema,
  otherActionDetailsSchema,
]);

export type FeedingActionDetails = z.infer<typeof feedingActionDetailsSchema>;
export type TreatmentActionDetails = z.infer<typeof treatmentActionDetailsSchema>;
export type FrameActionDetails = z.infer<typeof frameActionDetailsSchema>;
export type HarvestActionDetails = z.infer<typeof harvestActionDetailsSchema>;
export type BoxConfigurationActionDetails = z.infer<typeof boxConfigurationActionDetailsSchema>;
export type MaintenanceActionDetails = z.infer<typeof maintenanceActionDetailsSchema>;
export type MaintenanceComponent = z.infer<typeof maintenanceComponentSchema>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;
export type NoteActionDetails = z.infer<typeof noteActionDetailsSchema>;
export type SplitRole = z.infer<typeof splitRoleSchema>;
export type QueenDisposition = z.infer<typeof queenDispositionSchema>;
export type SplitActionDetails = z.infer<typeof splitActionDetailsSchema>;
export type OtherActionDetails = z.infer<typeof otherActionDetailsSchema>;
export type ActionDetails = z.infer<typeof actionDetailsSchema>;
