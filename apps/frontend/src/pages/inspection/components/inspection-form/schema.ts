import { z } from "zod";

export const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().optional(),
  weatherConditions: z.string().optional(),
});

export type InspectionFormData = z.infer<typeof inspectionSchema>;
