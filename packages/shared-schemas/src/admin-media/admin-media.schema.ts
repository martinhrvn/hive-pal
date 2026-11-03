import { z } from 'zod';

export const adminMediaTypeSchema = z.enum([
  'photo',
  'document',
  'inspection-audio',
  'quick-check-photo',
]);

export type AdminMediaType = z.infer<typeof adminMediaTypeSchema>;

export const adminMediaItemSchema = z.object({
  id: z.uuid(),
  type: adminMediaTypeSchema,
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.int().nonnegative(),
  storageKey: z.string(),
  createdAt: z.iso.datetime(),
  apiaryId: z.uuid().nullable(),
  apiaryName: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  ownerEmail: z.string().nullable(),
  hiveId: z.uuid().nullable(),
  inspectionId: z.uuid().nullable(),
  quickCheckId: z.uuid().nullable(),
  caption: z.string().nullable(),
});

export type AdminMediaItem = z.infer<typeof adminMediaItemSchema>;

export const adminMediaListQuerySchema = z.object({
  type: adminMediaTypeSchema.optional(),
  apiaryId: z.uuid().optional(),
  userId: z.uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).prefault(1),
  pageSize: z.coerce.number().int().min(1).max(200).prefault(50),
});

export type AdminMediaListQuery = z.infer<typeof adminMediaListQuerySchema>;

export const adminMediaListResponseSchema = z.object({
  items: z.array(adminMediaItemSchema),
  total: z.int().nonnegative(),
  page: z.int().min(1),
  pageSize: z.int().min(1),
});

export type AdminMediaListResponse = z.infer<
  typeof adminMediaListResponseSchema
>;

export const adminMediaStatsByTypeSchema = z.object({
  type: adminMediaTypeSchema,
  count: z.int().nonnegative(),
  totalSize: z.int().nonnegative(),
});

export const adminMediaStatsResponseSchema = z.object({
  totalCount: z.int().nonnegative(),
  totalSize: z.int().nonnegative(),
  byType: z.array(adminMediaStatsByTypeSchema),
});

export type AdminMediaStatsResponse = z.infer<
  typeof adminMediaStatsResponseSchema
>;

export const adminMediaDownloadUrlResponseSchema = z.object({
  downloadUrl: z.url(),
  expiresIn: z.int().positive(),
});

export type AdminMediaDownloadUrlResponse = z.infer<
  typeof adminMediaDownloadUrlResponseSchema
>;
