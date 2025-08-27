import { z } from 'zod';

// Enums
export const alertSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const alertStatusSchema = z.enum(['ACTIVE', 'DISMISSED', 'RESOLVED', 'SUPERSEDED']);

// Base schemas
export const alertMetadataSchema = z.record(z.unknown()).optional();

export const createAlertSchema = z.object({
  hiveId: z.string().uuid().optional(),
  type: z.string(),
  message: z.string(),
  severity: alertSeveritySchema,
  metadata: alertMetadataSchema,
});

export const updateAlertSchema = z.object({
  status: alertStatusSchema,
}).partial();

export const alertResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().optional(),
  type: z.string(),
  message: z.string(),
  severity: alertSeveritySchema,
  status: alertStatusSchema,
  metadata: alertMetadataSchema,
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const alertFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  type: z.string().optional(),
  severity: alertSeveritySchema.optional(),
  status: alertStatusSchema.optional(),
  includeSuperseded: z.boolean().default(false),
}).optional();

// Types
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type AlertMetadata = z.infer<typeof alertMetadataSchema>;
export type CreateAlert = z.infer<typeof createAlertSchema>;
export type UpdateAlert = z.infer<typeof updateAlertSchema>;
export type AlertResponse = z.infer<typeof alertResponseSchema>;
export type AlertFilter = z.infer<typeof alertFilterSchema>;