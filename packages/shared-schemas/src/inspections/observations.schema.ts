import { z } from 'zod';

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
});

export type ObservationSchemaType = z.infer<typeof observationSchema>;
