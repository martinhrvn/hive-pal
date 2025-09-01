import { z } from 'zod';

// Enums matching Prisma schema
export const FeedbackType = {
  BUG: 'BUG',
  SUGGESTION: 'SUGGESTION',
  OTHER: 'OTHER',
} as const;

export const FeedbackStatus = {
  NEW: 'NEW',
  REVIEWED: 'REVIEWED',
  RESOLVED: 'RESOLVED',
} as const;

export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];
export type FeedbackStatus =
  (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

// Create feedback schema
export const createFeedbackSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  type: z.enum([FeedbackType.BUG, FeedbackType.SUGGESTION, FeedbackType.OTHER]),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;

// Update feedback status schema
export const updateFeedbackStatusSchema = z.object({
  status: z.enum([
    FeedbackStatus.NEW,
    FeedbackStatus.REVIEWED,
    FeedbackStatus.RESOLVED,
  ]),
});

export type UpdateFeedbackStatusDto = z.infer<
  typeof updateFeedbackStatusSchema
>;

// Feedback filters schema for GET requests
export const feedbackFiltersSchema = z.object({
  type: z
    .enum([FeedbackType.BUG, FeedbackType.SUGGESTION, FeedbackType.OTHER])
    .optional(),
  status: z
    .enum([
      FeedbackStatus.NEW,
      FeedbackStatus.REVIEWED,
      FeedbackStatus.RESOLVED,
    ])
    .optional(),
  limit: z
    .number()
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  offset: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 0, {
      message: 'Offset must be non-negative',
    })
    .optional(),
});

export type FeedbackFilters = z.infer<typeof feedbackFiltersSchema>;

// Feedback response schema (for API responses)
export const feedbackSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  type: z.enum([FeedbackType.BUG, FeedbackType.SUGGESTION, FeedbackType.OTHER]),
  subject: z.string(),
  message: z.string(),
  status: z.enum([
    FeedbackStatus.NEW,
    FeedbackStatus.REVIEWED,
    FeedbackStatus.RESOLVED,
  ]),
  userId: z.string().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

// List response schema
export const feedbackListSchema = z.array(feedbackSchema);
export type FeedbackList = z.infer<typeof feedbackListSchema>;
