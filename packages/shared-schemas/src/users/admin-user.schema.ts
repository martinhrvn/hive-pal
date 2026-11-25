import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../auth/auth.schema';
import { userResponseSchema } from './user.schema';
import { userSummaryStatsSchema } from './user-stats.schema';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

// A user as the admin user management pages see it.
export const adminUserSchema = userResponseSchema.extend({
  lastLoginAt: z.date().nullable(),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.date().nullable(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserWithStatsSchema = adminUserSchema.extend({
  stats: userSummaryStatsSchema,
});
export type AdminUserWithStats = z.infer<typeof adminUserWithStatsSchema>;

export const adminUserStatusSchema = z.enum(['active', 'banned']);
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

export const adminUserSortSchema = z.enum([
  'createdAt',
  'lastLoginAt',
  'email',
]);
export type AdminUserSort = z.infer<typeof adminUserSortSchema>;

export const adminUserListQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: userRoleSchema.optional(),
  status: adminUserStatusSchema.optional(),
  sort: adminUserSortSchema.prefault('createdAt'),
  order: z.enum(['asc', 'desc']).prefault('desc'),
  page: z.coerce.number().int().min(1).prefault(1),
  pageSize: z.coerce.number().int().min(1).max(100).prefault(25),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminUserListParams = z.input<typeof adminUserListQuerySchema>;

export const adminUserListResponseSchema = z.object({
  items: z.array(adminUserWithStatsSchema),
  total: z.int().nonnegative(),
  page: z.int().min(1),
  pageSize: z.int().min(1),
});
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

// `setupLink`: the user gets an email with a link to choose their own
// password. `password`: the admin hands over a temporary password that must be
// changed at first login.
export const adminCreateUserSchema = z.discriminatedUnion('credential', [
  z.object({
    credential: z.literal('password'),
    email: z.email(),
    name: z.string().trim().min(1),
    role: userRoleSchema.prefault('USER'),
    password: z.string().min(PASSWORD_MIN_LENGTH),
  }),
  z.object({
    credential: z.literal('setupLink'),
    email: z.email(),
    name: z.string().trim().min(1),
    role: userRoleSchema.prefault('USER'),
  }),
]);
export type AdminCreateUser = z.infer<typeof adminCreateUserSchema>;
export type AdminCreateUserInput = z.input<typeof adminCreateUserSchema>;

export const adminUserCapabilitiesSchema = z.object({
  /** Whether outgoing mail is configured, so setup links can be emailed. */
  mailEnabled: z.boolean(),
  /** Whether people can create their own accounts (DISABLE_REGISTRATION). */
  registrationEnabled: z.boolean(),
});
export type AdminUserCapabilities = z.infer<typeof adminUserCapabilitiesSchema>;
