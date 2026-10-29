import { z } from 'zod';

export const FrameSizeStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type FrameSizeStatus =
  (typeof FrameSizeStatus)[keyof typeof FrameSizeStatus];

// Full frame size response schema
export const frameSizeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  isBuiltIn: z.boolean(),
  status: z.enum([
    FrameSizeStatus.PENDING,
    FrameSizeStatus.APPROVED,
    FrameSizeStatus.REJECTED,
  ]),
  createdByUserId: z.string().uuid().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type FrameSize = z.infer<typeof frameSizeSchema>;

// Create frame size schema (user submission)
export const createFrameSizeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  depth: z.number().positive('Depth must be positive'),
});

export type CreateFrameSizeDto = z.infer<typeof createFrameSizeSchema>;

// Edit a frame size (its creator, or an admin). Same constraints as create;
// at least one field has to change — enforced by the API, not here, so the
// schema stays a plain object for @ZodValidation.
export const updateFrameSizeSchema = createFrameSizeSchema.partial();

export type UpdateFrameSizeDto = z.infer<typeof updateFrameSizeSchema>;

// List response
export const frameSizeListSchema = z.array(frameSizeSchema);
export type FrameSizeList = z.infer<typeof frameSizeListSchema>;
