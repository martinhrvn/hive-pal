import { z } from 'zod';
import { userResponseSchema } from './user.schema';

// Summary stats for user list table
export const userSummaryStatsSchema = z.object({
  apiariesCount: z.number(),
  hivesCount: z.number(),
  inspectionsCount: z.number(),
  lastActivityDate: z.string().nullable(),
});

// Extended user response with summary stats
export const userWithStatsResponseSchema = userResponseSchema.extend({
  stats: userSummaryStatsSchema,
});

// Action type breakdown for recent activity
export const actionBreakdownSchema = z.object({
  type: z.string(),
  count: z.number(),
});

// Per-apiary breakdown
export const apiaryBreakdownSchema = z.object({
  apiaryId: z.string(),
  apiaryName: z.string(),
  hivesCount: z.number(),
  inspectionsCount: z.number(),
  lastInspectionDate: z.string().nullable(),
});

// Detailed stats for user detail page
export const userDetailedStatsSchema = z.object({
  userId: z.string(),
  userName: z.string().nullable(),
  email: z.string(),
  summary: z.object({
    totalApiaries: z.number(),
    totalHives: z.number(),
    totalInspections: z.number(),
    lastActivityDate: z.string().nullable(),
    lastInspectionDate: z.string().nullable(),
  }),
  recentActivity: z.object({
    period: z.literal('last30days'),
    inspectionsCount: z.number(),
    actionsCount: z.number(),
    actionsByType: z.array(actionBreakdownSchema),
  }),
  apiaryBreakdown: z.array(apiaryBreakdownSchema),
});

// Type exports
export type UserSummaryStats = z.infer<typeof userSummaryStatsSchema>;
export type UserWithStatsResponse = z.infer<typeof userWithStatsResponseSchema>;
export type ActionBreakdown = z.infer<typeof actionBreakdownSchema>;
export type ApiaryBreakdown = z.infer<typeof apiaryBreakdownSchema>;
export type UserDetailedStats = z.infer<typeof userDetailedStatsSchema>;
