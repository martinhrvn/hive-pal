"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectionFilterSchema = exports.inspectionResponseSchema = exports.createInsectionResponseSchema = exports.scoreSchema = exports.updateInspectionResponseSchema = exports.updateInspectionSchema = exports.createInspectionSchema = void 0;
const zod_1 = require("zod");
const observations_schema_1 = require("./observations.schema");
const status_1 = require("./status");
const actions_1 = require("../actions");
// Base schema for creating inspections
exports.createInspectionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    hiveId: zod_1.z.string().uuid(),
    date: zod_1.z.string().datetime(),
    temperature: zod_1.z.number().nullish(),
    weatherConditions: zod_1.z.string().nullish(),
    notes: zod_1.z.string().nullish(),
    observations: observations_schema_1.observationSchema.optional(),
    actions: zod_1.z.array(actions_1.createActionSchema).optional(),
});
// Schema for updating inspections
exports.updateInspectionSchema = exports.createInspectionSchema.partial().extend({
    id: zod_1.z.string().uuid(),
    status: status_1.inspectionStatusSchema.optional(),
});
exports.updateInspectionResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: status_1.inspectionStatusSchema.optional(),
    date: zod_1.z.string().datetime(),
    hiveId: zod_1.z.string().uuid(),
});
exports.scoreSchema = zod_1.z.object({
    overallScore: zod_1.z.number().nullable(),
    populationScore: zod_1.z.number().nullable(),
    storesScore: zod_1.z.number().nullable(),
    queenScore: zod_1.z.number().nullable(),
    warnings: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number(),
});
exports.createInsectionResponseSchema = zod_1.z.object({
    hiveId: zod_1.z.string().uuid(),
    status: status_1.inspectionStatusSchema,
    date: zod_1.z.string().datetime(),
    id: zod_1.z.string().uuid(),
});
// Schema for inspection responses
exports.inspectionResponseSchema = exports.createInspectionSchema.extend({
    id: zod_1.z.string().uuid(),
    status: status_1.inspectionStatusSchema,
    date: zod_1.z
        .date()
        .transform(d => d.toISOString())
        .or(zod_1.z.string().datetime()),
    score: exports.scoreSchema.optional(),
    actions: zod_1.z.array(actions_1.actionResponseSchema),
});
// Schema for filtering inspections
exports.inspectionFilterSchema = zod_1.z.object({
    hiveId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    status: status_1.inspectionStatusSchema.optional(),
});
