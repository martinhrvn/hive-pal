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
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
  passwordChangeRequired: z.boolean(),
});

// Auth response schema
export const authResponseSchema = z.object({
  access_token: z.string(),
  user: userSchema,
});

// Type exports
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;