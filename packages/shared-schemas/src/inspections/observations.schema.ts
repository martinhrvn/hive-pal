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

export const observationSchema = z.object({
  strength: z.number().int().min(0).max(10).nullish(),
  uncappedBrood: z.number().int().min(0).max(10).nullish(),
  cappedBrood: z.number().int().min(0).max(10).nullish(),
  honeyStores: z.number().int().min(0).max(10).nullish(),
  pollenStores: z.number().int().min(0).max(10).nullish(),
  queenCells: z.number().int().min(0).nullish(),
  swarmCells: z.boolean().nullish(),
  supersedureCells: z.boolean().nullish(),
  queenSeen: z.boolean().nullish(),
  
  // New observation types
  broodPattern: broodPatternSchema,
  additionalObservations: z.array(additionalObservationSchema).optional(),
  reminderObservations: z.array(reminderObservationSchema).optional(),
});

export type ObservationSchemaType = z.infer<typeof observationSchema>;
export type BroodPatternType = z.infer<typeof broodPatternSchema>;
export type AdditionalObservationType = z.infer<typeof additionalObservationSchema>;
export type ReminderObservationType = z.infer<typeof reminderObservationSchema>;
