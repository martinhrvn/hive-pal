import { z } from 'zod';

export const inspectionTypeEnum = z.enum(['subjective', 'data_driven']);
export type InspectionType = z.infer<typeof inspectionTypeEnum>;

export const apiarySettingsSchema = z
  .object({
    inspectionType: inspectionTypeEnum.default('data_driven'),
  })
  .optional();
export type ApiarySettings = z.infer<typeof apiarySettingsSchema>;

// Base schema for creating apiaries
export const createApiarySchema = z.object({
  name: z.string(),
  location: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  featurePhotoId: z.string().uuid().nullish(),
  settings: apiarySettingsSchema,
});

// Schema for updating apiaries
export const updateApiarySchema = createApiarySchema.partial();

export const apiaryRoleEnum = z.enum(['OWNER', 'EDITOR', 'VIEWER']);
export type ApiaryRole = z.infer<typeof apiaryRoleEnum>;

// Schema for apiary response
export const apiaryResponseSchema = createApiarySchema.extend({
  id: z.string().uuid(),
  featurePhotoUrl: z.string().nullish(),
  role: apiaryRoleEnum.optional(),
  isShared: z.boolean().optional(),
  settings: apiarySettingsSchema,
});

// Schema for apiary map point (admin view)
export const apiaryMapPointSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  userId: z.string().uuid(),
  hiveCount: z.number(),
});

// Wrapper for the apiaries list endpoint
export const apiaryListResponseSchema = z.object({
  apiaries: z.array(apiaryResponseSchema),
  pendingMemberships: z.number(),
});

export type CreateApiary = z.infer<typeof createApiarySchema>;
export type UpdateApiary = z.infer<typeof updateApiarySchema>;
export type ApiaryResponse = z.infer<typeof apiaryResponseSchema>;
export type ApiaryListResponse = z.infer<typeof apiaryListResponseSchema>;
export type ApiaryMapPoint = z.infer<typeof apiaryMapPointSchema>;
