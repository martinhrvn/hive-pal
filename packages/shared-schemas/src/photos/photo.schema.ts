import { z } from 'zod';

export const createPhotoSchema = z.object({
  apiaryId: z.string().uuid(),
  hiveId: z.string().uuid().optional(),
  caption: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

export type CreatePhoto = z.infer<typeof createPhotoSchema>;

export const photoResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().nullable(),
  apiaryId: z.string().uuid(),
  caption: z.string().nullable(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  date: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PhotoResponse = z.infer<typeof photoResponseSchema>;

export const photoFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  apiaryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PhotoFilter = z.infer<typeof photoFilterSchema>;
