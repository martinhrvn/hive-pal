"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeQueenSchema = exports.queenResponseSchema = exports.updateQueenSchema = exports.createQueenSchema = void 0;
const zod_1 = require("zod");
const status_1 = require("./status");
// Base schema for creating queens
exports.createQueenSchema = zod_1.z.object({
    hiveId: zod_1.z.string().uuid().optional().nullable(),
    marking: zod_1.z.string().optional().nullable(),
    color: zod_1.z.string().optional().nullable(),
    year: zod_1.z.number().nullable(),
    source: zod_1.z.string().optional().nullable(),
    status: status_1.queenStatusSchema.optional().nullable(),
    installedAt: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()).nullable(),
    replacedAt: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()).nullable(),
});
// Schema for updating queens
exports.updateQueenSchema = exports.createQueenSchema.partial();
// Schema for queen response
exports.queenResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    hiveId: zod_1.z.string().uuid().optional().nullable(),
    marking: zod_1.z.string().optional().nullable(),
    color: zod_1.z.string().optional().nullable(),
    year: zod_1.z.number().nullable(),
    source: zod_1.z.string().optional().nullable(),
    status: status_1.queenStatusSchema.nullable(),
    installedAt: zod_1.z.string().datetime().optional().nullable(),
    replacedAt: zod_1.z.string().datetime().optional().nullable(),
});
exports.activeQueenSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    hiveId: zod_1.z.string().uuid().optional(),
    year: zod_1.z.number().nullish(),
    marking: zod_1.z.string().nullish(),
    installedAt: zod_1.z.string().datetime().optional().or(zod_1.z.date()).nullable(),
    color: zod_1.z.string().nullish(),
    status: status_1.queenStatusSchema.nullish()
});
