import { z } from 'zod';

export const createDocumentSchema = z.object({
  apiaryId: z.string().uuid(),
  hiveId: z.string().uuid().optional(),
  title: z.string().max(200),
  notes: z.string().max(2000).optional(),
  date: z.string().datetime().optional(),
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;

export const documentResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().nullable(),
  apiaryId: z.string().uuid(),
  title: z.string(),
  notes: z.string().nullable(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  date: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DocumentResponse = z.infer<typeof documentResponseSchema>;

export const documentFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  apiaryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DocumentFilter = z.infer<typeof documentFilterSchema>;
