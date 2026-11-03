import { z } from 'zod';

export const createDocumentSchema = z.object({
  apiaryId: z.uuid(),
  hiveId: z.uuid().optional(),
  title: z.string().max(200),
  notes: z.string().max(2000).optional(),
  date: z.iso.datetime().optional(),
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;

export const documentResponseSchema = z.object({
  id: z.uuid(),
  hiveId: z.uuid().nullable(),
  apiaryId: z.uuid(),
  title: z.string(),
  notes: z.string().nullable(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  date: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type DocumentResponse = z.infer<typeof documentResponseSchema>;

export const documentFilterSchema = z.object({
  hiveId: z.uuid().optional(),
  apiaryId: z.uuid().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export type DocumentFilter = z.infer<typeof documentFilterSchema>;
