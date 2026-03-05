import { z } from 'zod';

// Resource types that can be shared
export enum ShareResourceType {
  HARVEST = 'HARVEST',
  INSPECTION = 'INSPECTION',
}

// Create share link request
export const createShareLinkSchema = z.object({
  resourceType: z.nativeEnum(ShareResourceType),
  resourceId: z.string().uuid(),
});

// Share link response
export const shareLinkResponseSchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  resourceType: z.nativeEnum(ShareResourceType),
  resourceId: z.string().uuid(),
  url: z.string(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

// Shared harvest data (public, no PII)
export const sharedHarvestResponseSchema = z.object({
  resourceType: z.literal(ShareResourceType.HARVEST),
  date: z.string(),
  totalWeight: z.number().nullable(),
  totalWeightUnit: z.string(),
  status: z.string(),
  apiaryName: z.string(),
  harvestHives: z.array(
    z.object({
      hiveName: z.string(),
      framesTaken: z.number(),
      honeyAmount: z.number().nullable(),
      honeyAmountUnit: z.string().optional(),
    }),
  ),
});

// Shared inspection data (public, no PII)
export const sharedInspectionResponseSchema = z.object({
  resourceType: z.literal(ShareResourceType.INSPECTION),
  date: z.string(),
  hiveName: z.string(),
  temperature: z.number().nullable(),
  weatherConditions: z.string().nullable(),
  observations: z.array(
    z.object({
      type: z.string(),
      numericValue: z.number().nullable().optional(),
      textValue: z.string().nullable().optional(),
      booleanValue: z.boolean().nullable().optional(),
    }),
  ),
  score: z.number().nullable(),
  notes: z.array(z.string()),
});

// Union type for shared resource response
export const sharedResourceResponseSchema = z.discriminatedUnion(
  'resourceType',
  [sharedHarvestResponseSchema, sharedInspectionResponseSchema],
);

// Type exports
export type CreateShareLink = z.infer<typeof createShareLinkSchema>;
export type ShareLinkResponse = z.infer<typeof shareLinkResponseSchema>;
export type SharedHarvestResponse = z.infer<typeof sharedHarvestResponseSchema>;
export type SharedInspectionResponse = z.infer<
  typeof sharedInspectionResponseSchema
>;
export type SharedResourceResponse = z.infer<
  typeof sharedResourceResponseSchema
>;
