import { z } from 'zod';

export const featuresResponseSchema = z.object({
  storageEnabled: z.boolean(),
  aiEnabled: z.boolean(),
});

export type FeaturesResponse = z.infer<typeof featuresResponseSchema>;
