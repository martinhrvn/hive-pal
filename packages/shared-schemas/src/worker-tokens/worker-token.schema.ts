import { z } from 'zod';

export const workerTokenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  prefix: z.string(),
  createdAt: z.string().or(z.date()),
  lastSeenAt: z.string().or(z.date()).nullable(),
  revokedAt: z.string().or(z.date()).nullable(),
});

export type WorkerToken = z.infer<typeof workerTokenSchema>;

export const createWorkerTokenSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export type CreateWorkerTokenDto = z.infer<typeof createWorkerTokenSchema>;

export const workerTokenCreatedSchema = workerTokenSchema.extend({
  token: z.string(),
});

export type WorkerTokenCreated = z.infer<typeof workerTokenCreatedSchema>;

export const workerTokenListSchema = z.array(workerTokenSchema);
export type WorkerTokenList = z.infer<typeof workerTokenListSchema>;

export const workerStatusSchema = z.object({
  workersOnline: z.number().int().nonnegative(),
  lastSeen: z.string().or(z.date()).nullable(),
});

export type WorkerStatus = z.infer<typeof workerStatusSchema>;
