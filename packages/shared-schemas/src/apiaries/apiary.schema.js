"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiaryResponseSchema = exports.updateApiarySchema = exports.createApiarySchema = void 0;
const zod_1 = require("zod");
// Base schema for creating apiaries
exports.createApiarySchema = zod_1.z.object({
    name: zod_1.z.string(),
    location: zod_1.z.string().nullish(),
    latitude: zod_1.z.number().nullish(),
    longitude: zod_1.z.number().nullish(),
});
// Schema for updating apiaries
exports.updateApiarySchema = exports.createApiarySchema.partial();
// Schema for apiary response
exports.apiaryResponseSchema = exports.createApiarySchema.extend({
    id: zod_1.z.string().uuid(),
});
