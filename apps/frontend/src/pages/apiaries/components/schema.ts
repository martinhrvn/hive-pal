import { z } from 'zod';

export const apiariesSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
});
