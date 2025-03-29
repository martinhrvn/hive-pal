"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResponseSchema = exports.userSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Login schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
// Register schema
exports.registerSchema = exports.loginSchema.extend({
    name: zod_1.z.string().optional(),
});
// User DTO schema
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().nullable(),
    role: zod_1.z.enum(['USER', 'ADMIN']).nullable(),
    passwordChangeRequired: zod_1.z.boolean(),
});
// Auth response schema
exports.authResponseSchema = zod_1.z.object({
    access_token: zod_1.z.string(),
    user: exports.userSchema,
});
