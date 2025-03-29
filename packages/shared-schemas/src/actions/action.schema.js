"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionResponseSchema = exports.createActionSchema = exports.baseActionSchema = void 0;
const zod_1 = require("zod");
const details_schema_1 = require("./details.schema");
const types_1 = require("./types");
// Base schema for all actions
exports.baseActionSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
// Create schema for actions (without IDs)
exports.createActionSchema = exports.baseActionSchema.extend({
    type: types_1.actionTypeSchema,
    details: details_schema_1.actionDetailsSchema,
});
// Response schema for actions (with IDs)
exports.actionResponseSchema = exports.createActionSchema.extend({
    id: zod_1.z.string().uuid(),
    inspectionId: zod_1.z.string().uuid(),
});
