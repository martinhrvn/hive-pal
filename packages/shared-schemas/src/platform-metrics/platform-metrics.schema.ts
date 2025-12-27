import { z } from 'zod';

// Platform metrics snapshot response
export const platformMetricsSnapshotSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  totalUsers: z.number(),
  totalApiaries: z.number(),
  totalHives: z.number(),
  totalInspections: z.number(),
  totalActions: z.number(),
  totalQueens: z.number(),
  totalHarvests: z.number(),
  totalEquipmentItems: z.number(),
  activeUsers7Days: z.number(),
  activeUsers30Days: z.number(),
  createdAt: z.string(),
});

export type PlatformMetricsSnapshot = z.infer<typeof platformMetricsSnapshotSchema>;

// Query params for filtering snapshots
export const platformMetricsQueryParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PlatformMetricsQueryParams = z.infer<typeof platformMetricsQueryParamsSchema>;
