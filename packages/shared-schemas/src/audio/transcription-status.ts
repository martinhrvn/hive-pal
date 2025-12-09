import { z } from 'zod';

export const transcriptionStatusSchema = z.enum([
  'NONE',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export type TranscriptionStatus = z.infer<typeof transcriptionStatusSchema>;
