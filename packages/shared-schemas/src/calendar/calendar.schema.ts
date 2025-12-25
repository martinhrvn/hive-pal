import { z } from 'zod';
import { inspectionResponseSchema } from '../inspections/inspection.schema';
import { actionResponseSchema } from '../actions/action.schema';

// Calendar filter schema
export const calendarFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hiveId: z.string().uuid().optional(),
});

// Calendar event schema
export const calendarEventSchema = z.object({
  date: z.string(),
  inspections: z.array(inspectionResponseSchema),
  standaloneActions: z.array(actionResponseSchema),
});

// Calendar response schema (array of events)
export const calendarResponseSchema = z.array(calendarEventSchema);

// Subscription URL response schema
export const subscriptionUrlResponseSchema = z.object({
  subscriptionUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

// Export types
export type CalendarFilter = z.infer<typeof calendarFilterSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarResponse = z.infer<typeof calendarResponseSchema>;
export type SubscriptionUrlResponse = z.infer<
  typeof subscriptionUrlResponseSchema
>;