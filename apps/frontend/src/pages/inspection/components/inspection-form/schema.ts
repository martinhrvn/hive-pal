import { z } from 'zod';

export const observationSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  numericValue: z.number().min(1).max(10),
  notes: z.string().optional(),
});

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().optional(),
  weatherConditions: z.string().optional(),
  observations: z.array(observationSchema).optional(),
});

export type ObservationFormData = z.infer<typeof observationSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
