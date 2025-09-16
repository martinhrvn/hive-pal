import { z } from 'zod';

// Base user schema (extends the one in auth)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  passwordChangeRequired: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Admin reset password schema
export const adminResetPasswordSchema = z.object({
  tempPassword: z
    .string()
    .min(6, 'Temporary password must be at least 6 characters'),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  language: z.enum(['en', 'sk']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  inspectionReminders: z.boolean().optional(),
  harvestReminders: z.boolean().optional(),
});

// Update user info schema
export const updateUserInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// DTO Classes for Swagger/NestJS - using declare to avoid initialization
export declare class UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  passwordChangeRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export declare class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export declare class AdminResetPasswordDto {
  tempPassword: string;
}

export declare class UpdateUserInfoDto {
  name?: string;
  email?: string;
}

// Type exports
export type UserResponse = z.infer<typeof userResponseSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type AdminResetPassword = z.infer<typeof adminResetPasswordSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UpdateUserInfo = z.infer<typeof updateUserInfoSchema>;

export type UserPreferencesDto = z.infer<typeof userPreferencesSchema>;
