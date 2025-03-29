"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hiveFilterSchema = exports.hiveResponseSchema = exports.hiveDetailResponseSchema = exports.hiveScoreSchema = exports.updateHiveResponseSchema = exports.updateHiveSchema = exports.createHiveResponseSchema = exports.createHiveSchema = void 0;
const zod_1 = require("zod");
const status_1 = require("./status");
const box_schema_1 = require("./box.schema");
const queens_1 = require("../queens");
// Base schema for creating hives
exports.createHiveSchema = zod_1.z.object({
    name: zod_1.z.string(),
    apiaryId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    installationDate: zod_1.z.date().optional().or(zod_1.z.string().datetime().optional()),
    status: status_1.hiveStatusSchema.optional(),
});
exports.createHiveResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: status_1.hiveStatusSchema,
});
// Schema for updating hives
exports.updateHiveSchema = exports.createHiveSchema.partial().extend({
    id: zod_1.z.string().uuid(),
});
exports.updateHiveResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    apiaryId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    installationDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    status: status_1.hiveStatusSchema.optional(),
});
exports.hiveScoreSchema = zod_1.z.object({
    overallScore: zod_1.z.number().nullish(),
    populationScore: zod_1.z.number().nullish(),
    storesScore: zod_1.z.number().nullish(),
    queenScore: zod_1.z.number().nullish(),
    warnings: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number(),
});
// Schema for detailed hive response
exports.hiveDetailResponseSchema = exports.createHiveSchema.extend({
    id: zod_1.z.string().uuid(),
    status: status_1.hiveStatusSchema,
    boxes: zod_1.z.array(box_schema_1.boxSchema),
    hiveScore: exports.hiveScoreSchema,
    activeQueen: queens_1.activeQueenSchema.nullish(),
    lastInspectionDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
});
// Schema for basic hive response
exports.hiveResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    status: status_1.hiveStatusSchema,
    apiaryId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    installationDate: zod_1.z.string().datetime().optional(),
    lastInspectionDate: zod_1.z.string().datetime().optional(),
    activeQueen: queens_1.activeQueenSchema.nullish(),
});
// Schema for filtering hives
exports.hiveFilterSchema = zod_1.z.object({
    apiaryId: zod_1.z.string().uuid().optional(),
    status: status_1.hiveStatusSchema.optional(),
    includeInactive: zod_1.z.boolean().optional(),
});
