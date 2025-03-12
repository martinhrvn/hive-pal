import { z } from 'zod';

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

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().nullish(),
  weatherConditions: z.string().nullish(),
  observations: observationSchema,
  notes: z.string().nullish(),
});

export type ObservationFormData = z.infer<typeof observationSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
