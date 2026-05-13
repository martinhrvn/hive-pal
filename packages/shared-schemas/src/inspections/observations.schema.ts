import { z } from 'zod';

// Brood pattern options
export const broodPatternSchema = z.enum([
  'solid',
  'spotty', 
  'scattered',
  'patchy',
  'excellent',
  'poor'
]).nullish();

// Additional observations (badges/tags)
export const additionalObservationSchema = z.enum([
  'calm',
  'defensive', 
  'aggressive',
  'nervous',
  'varroa_present',
  'small_hive_beetle',
  'wax_moths',
  'ants_present',
  'healthy',
  'active',
  'sluggish',
  'thriving'
]);

// Reminder observations (for future alerts)
export const reminderObservationSchema = z.enum([
  'honey_bound',
  'overcrowded',
  'needs_super',
  'queen_issues',
  'requires_treatment',
  'low_stores',
  'prepare_for_winter'
]);

// Base observation schema without refinements - can be extended
export const observationBaseSchema = z.object({
  strength: z.number().int().min(0).nullish(),
  uncappedBrood: z.number().int().min(0).max(10).nullish(),
  cappedBrood: z.number().int().min(0).max(10).nullish(),
  honeyStores: z.number().int().min(0).max(10).nullish(),
  pollenStores: z.number().int().min(0).max(10).nullish(),
  queenCells: z.number().int().min(0).nullish(),
  swarmCells: z.boolean().nullish(),
  supersedureCells: z.boolean().nullish(),
  queenSeen: z.boolean().nullish(),

  // Frame count observations – actual number of frames of each type
  totalFrames: z.number().int().min(0).nullish(),
  eggsFrames: z.number().int().min(0).nullish(),
  uncappedBroodFrames: z.number().int().min(0).nullish(),
  cappedBroodFrames: z.number().int().min(0).nullish(),
  droneBroodFrames: z.number().int().min(0).nullish(),
  pollenFrames: z.number().int().min(0).nullish(),
  nectarFrames: z.number().int().min(0).nullish(),
  honeyFrames: z.number().int().min(0).nullish(),
  emptyFrames: z.number().int().min(0).nullish(),

  // New observation types
  broodPattern: broodPatternSchema,
  additionalObservations: z.array(additionalObservationSchema).optional(),
  reminderObservations: z.array(reminderObservationSchema).optional(),
});

// Observation schema - frame counts can overlap and are unrestricted
// (e.g., eggs=10, cappedBrood=10 with totalFrames=10 means 50% each)
export const observationSchema = observationBaseSchema;

export type ObservationSchemaType = z.infer<typeof observationSchema>;
export type BroodPatternType = z.infer<typeof broodPatternSchema>;
export type AdditionalObservationType = z.infer<typeof additionalObservationSchema>;
export type ReminderObservationType = z.infer<typeof reminderObservationSchema>;
