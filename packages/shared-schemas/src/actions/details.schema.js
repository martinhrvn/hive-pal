"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionDetailsSchema = exports.otherActionDetailsSchema = exports.frameActionDetailsSchema = exports.treatmentActionDetailsSchema = exports.feedingActionDetailsSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("./types");
// Base details schemas for specific action types
exports.feedingActionDetailsSchema = zod_1.z.object({
    type: zod_1.z.literal(types_1.ActionType.FEEDING),
    feedType: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    unit: zod_1.z.string(),
    concentration: zod_1.z.string().optional(),
});
exports.treatmentActionDetailsSchema = zod_1.z.object({
    type: zod_1.z.literal(types_1.ActionType.TREATMENT),
    product: zod_1.z.string(),
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string(),
    duration: zod_1.z.string().optional(),
});
exports.frameActionDetailsSchema = zod_1.z.object({
    type: zod_1.z.literal(types_1.ActionType.FRAME),
    quantity: zod_1.z.number().int(),
});
exports.otherActionDetailsSchema = zod_1.z.object({
    type: zod_1.z.literal(types_1.ActionType.OTHER),
});
// Combined details schema using discriminated union
exports.actionDetailsSchema = zod_1.z.discriminatedUnion('type', [
    exports.feedingActionDetailsSchema,
    exports.treatmentActionDetailsSchema,
    exports.frameActionDetailsSchema,
    exports.otherActionDetailsSchema,
]);
