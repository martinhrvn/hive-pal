import { z } from 'zod';

// Function to handle optional nullable fields
function nullableOptional<T extends z.ZodType>(schema: T) {
  return schema.nullish();
}

// Define the possible queen statuses
export const queenStatusEnum = z.enum(['ACTIVE', 'REPLACED', 'DEAD', 'UNKNOWN']);

// Define the schema for queen form
export const queenSchema = z.object({
  hiveId: z.string(),
  marking: nullableOptional(z.string()),
  color: nullableOptional(z.string()),
  year: nullableOptional(z.number().int().positive()),
  source: nullableOptional(z.string()),
  status: queenStatusEnum,
  installedAt: z.date(),
  replacedAt: nullableOptional(z.date()),
});

// Export the type derived from the schema
export type QueenFormData = z.infer<typeof queenSchema>;