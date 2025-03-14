import { z } from 'zod';

export const apiariesSchema = z.object({
  name: z.string().nonempty(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
