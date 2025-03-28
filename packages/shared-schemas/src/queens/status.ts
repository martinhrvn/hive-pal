import { z } from 'zod';

export const queenStatusSchema = z.enum([
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
]);

export type QueenStatus = z.infer<typeof queenStatusSchema>;