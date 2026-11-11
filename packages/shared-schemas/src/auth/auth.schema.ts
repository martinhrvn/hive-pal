import { z } from 'zod';

// Minimum length for any password a user sets (sign-up, reset, change, admin
// reset). The backend passes this to better-auth's `minPasswordLength`, so the
// frontend and backend checks cannot drift apart.
export const PASSWORD_MIN_LENGTH = 8;

export const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH);

// Login schema. No minimum length: sign-in only checks the credentials, and
// accounts created under an older, shorter minimum must still be able to log in.
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Register schema
export const registerSchema = loginSchema.extend({
  password: newPasswordSchema,
  name: z.string().optional(),
  privacyPolicyConsent: z.boolean(),
  newsletterConsent: z.boolean().optional(),
});

// User DTO schema
export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']).nullable(),
  passwordChangeRequired: z.boolean(),
});

// Auth response schema
export const authResponseSchema = z.object({
  access_token: z.string(),
  user: userSchema,
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.email(),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: newPasswordSchema,
});

// Success response schema
export const successResponseSchema = z.object({
  message: z.string(),
});

// Type exports
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
