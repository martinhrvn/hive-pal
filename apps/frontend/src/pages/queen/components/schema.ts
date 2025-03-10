import { z } from 'zod';

// Define the possible queen statuses
export const queenStatusEnum = z.enum([
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
]);

// Define the schema for queen form
export const queenSchema = z.object({
  hiveId: z.string(),
  marking: z.string().nullish(),
  color: z.string().nullish(),
  year: z.number().int().positive(),
  source: z.string().nullish(),
  status: queenStatusEnum,
  installedAt: z.date(),
  replacedAt: z.date().nullish(),
});

// Export the type derived from the schema
export type QueenFormData = z.infer<typeof queenSchema>;
