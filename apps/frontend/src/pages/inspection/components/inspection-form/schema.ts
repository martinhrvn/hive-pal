import { z } from 'zod';

function nullableOptional<T extends z.ZodType>(schema: T) {
  return schema.nullish();
}

export const observationSchema = z.object({
  strength: nullableOptional(z.number()),
  uncappedBrood: nullableOptional(z.number()),
  cappedBrood: nullableOptional(z.number()),
  honeyStores: nullableOptional(z.number()),
  pollenStores: nullableOptional(z.number()),
  queenCells: nullableOptional(z.number()),
  swarmCells: nullableOptional(z.number()),
  supersedureCells: nullableOptional(z.number()),
  queenSeen: nullableOptional(z.boolean()),
});

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: nullableOptional(z.number()),
  weatherConditions: nullableOptional(z.string()),
  observations: observationSchema,
});

export type ObservationFormData = z.infer<typeof observationSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
