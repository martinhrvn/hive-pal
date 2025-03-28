import { z } from 'zod';

// Base schema for creating apiaries
export const createApiarySchema = z.object({
  name: z.string(),
  location: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

// Schema for updating apiaries
export const updateApiarySchema = createApiarySchema.partial();

// Schema for apiary response
export const apiaryResponseSchema = createApiarySchema.extend({
  id: z.string().uuid(),
});

export type CreateApiary = z.infer<typeof createApiarySchema>;
export type UpdateApiary = z.infer<typeof updateApiarySchema>;
export type ApiaryResponse = z.infer<typeof apiaryResponseSchema>;