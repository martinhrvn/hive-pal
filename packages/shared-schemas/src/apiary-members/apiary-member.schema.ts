import { z } from 'zod';

export const apiaryMemberRoleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER']);

export const apiaryMemberSchema = z.object({
  id: z.string().uuid(),
  apiaryId: z.string().uuid(),
  userId: z.string().uuid(),
  role: apiaryMemberRoleSchema,
  invitedById: z.string().uuid(),
  invitedAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    name: z.string().nullable(),
  }),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

export type ApiaryMemberRole = z.infer<typeof apiaryMemberRoleSchema>;
export type ApiaryMember = z.infer<typeof apiaryMemberSchema>;
export type InviteMember = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRole = z.infer<typeof updateMemberRoleSchema>;
