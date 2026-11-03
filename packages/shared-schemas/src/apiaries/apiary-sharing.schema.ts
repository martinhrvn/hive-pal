import { z } from 'zod';
import { apiaryRoleEnum } from './apiary.schema';

export const membershipStatusEnum = z.enum(['PENDING', 'ACTIVE', 'REJECTED']);
export type MembershipStatus = z.infer<typeof membershipStatusEnum>;

// Create invite link
export const createApiaryInviteSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
  expiresAt: z.iso.datetime().optional(),
});

export type CreateApiaryInvite = z.infer<typeof createApiaryInviteSchema>;

// Invite response
export const apiaryInviteResponseSchema = z.object({
  id: z.uuid(),
  token: z.string(),
  apiaryId: z.uuid(),
  role: apiaryRoleEnum,
  expiresAt: z.iso.datetime().nullable(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type ApiaryInviteResponse = z.infer<typeof apiaryInviteResponseSchema>;

// Member response
export const apiaryMemberResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  role: apiaryRoleEnum,
  status: membershipStatusEnum,
  joinedAt: z.iso.datetime(),
});

export type ApiaryMemberResponse = z.infer<typeof apiaryMemberResponseSchema>;

// Update member (approve/reject/change role)
export const updateApiaryMemberSchema = z.object({
  status: membershipStatusEnum.optional(),
  role: z.enum(['EDITOR', 'VIEWER']).optional(),
});

export type UpdateApiaryMember = z.infer<typeof updateApiaryMemberSchema>;

// Invite info (public-facing, for join page)
export const inviteInfoResponseSchema = z.object({
  apiaryName: z.string(),
  role: apiaryRoleEnum,
  expired: z.boolean(),
  alreadyMember: z.boolean().optional(),
});

export type InviteInfoResponse = z.infer<typeof inviteInfoResponseSchema>;

// Join response
export const joinApiaryResponseSchema = z.object({
  apiaryId: z.uuid(),
  apiaryName: z.string(),
  role: apiaryRoleEnum,
  status: membershipStatusEnum,
});

export type JoinApiaryResponse = z.infer<typeof joinApiaryResponseSchema>;
