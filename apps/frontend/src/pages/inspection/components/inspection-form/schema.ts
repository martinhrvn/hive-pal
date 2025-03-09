import { z } from 'zod';

export const observationSchema = z.object({
  strength: z.number().optional(),
  uncappedBrood: z.number().optional(),
  cappedBrood: z.number().optional(),
  honeyStores: z.number().optional(),
  pollenStores: z.number().optional(),
  queenCells: z.number().optional(),
  swarmCells: z.number().optional(),
  supersedureCells: z.number().optional(),
  queenSeen: z.boolean().optional(),
});

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().optional(),
  weatherConditions: z.string().optional(),
  observations: observationSchema,
});

export type ObservationFormData = z.infer<typeof observationSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
