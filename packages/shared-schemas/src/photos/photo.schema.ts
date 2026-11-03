import { z } from 'zod';

export const createPhotoSchema = z.object({
  apiaryId: z.uuid(),
  hiveId: z.uuid().optional(),
  inspectionId: z.uuid().optional(),
  caption: z.string().max(500).optional(),
  date: z.iso.datetime().optional(),
});

export type CreatePhoto = z.infer<typeof createPhotoSchema>;

export const photoResponseSchema = z.object({
  id: z.uuid(),
  hiveId: z.uuid().nullable(),
  apiaryId: z.uuid(),
  inspectionId: z.uuid().nullable(),
  caption: z.string().nullable(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  date: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PhotoResponse = z.infer<typeof photoResponseSchema>;

export const photoFilterSchema = z.object({
  hiveId: z.uuid().optional(),
  apiaryId: z.uuid().optional(),
  inspectionId: z.uuid().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export type PhotoFilter = z.infer<typeof photoFilterSchema>;
