import { z } from 'zod';

export const adminMediaTypeSchema = z.enum([
  'photo',
  'document',
  'inspection-audio',
  'quick-check-photo',
]);

export type AdminMediaType = z.infer<typeof adminMediaTypeSchema>;

export const adminMediaItemSchema = z.object({
  id: z.string().uuid(),
  type: adminMediaTypeSchema,
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
  storageKey: z.string(),
  createdAt: z.string().datetime(),
  apiaryId: z.string().uuid().nullable(),
  apiaryName: z.string().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  ownerEmail: z.string().nullable(),
  hiveId: z.string().uuid().nullable(),
  inspectionId: z.string().uuid().nullable(),
  quickCheckId: z.string().uuid().nullable(),
  caption: z.string().nullable(),
});

export type AdminMediaItem = z.infer<typeof adminMediaItemSchema>;

export const adminMediaListQuerySchema = z.object({
  type: adminMediaTypeSchema.optional(),
  apiaryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type AdminMediaListQuery = z.infer<typeof adminMediaListQuerySchema>;

export const adminMediaListResponseSchema = z.object({
  items: z.array(adminMediaItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export type AdminMediaListResponse = z.infer<typeof adminMediaListResponseSchema>;

export const adminMediaStatsByTypeSchema = z.object({
  type: adminMediaTypeSchema,
  count: z.number().int().nonnegative(),
  totalSize: z.number().int().nonnegative(),
});

export const adminMediaStatsResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  totalSize: z.number().int().nonnegative(),
  byType: z.array(adminMediaStatsByTypeSchema),
});

export type AdminMediaStatsResponse = z.infer<typeof adminMediaStatsResponseSchema>;

export const adminMediaDownloadUrlResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
});

export type AdminMediaDownloadUrlResponse = z.infer<
  typeof adminMediaDownloadUrlResponseSchema
>;
