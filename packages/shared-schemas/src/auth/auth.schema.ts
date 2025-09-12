import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Register schema
export const registerSchema = loginSchema.extend({
  name: z.string().optional(),
});

// User DTO schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
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
  email: z.string().email(),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
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