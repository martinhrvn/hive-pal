"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observationSchema = void 0;
const zod_1 = require("zod");
exports.observationSchema = zod_1.z.object({
    strength: zod_1.z.number().int().min(0).max(10).nullish(),
    uncappedBrood: zod_1.z.number().int().min(0).max(10).nullish(),
    cappedBrood: zod_1.z.number().int().min(0).max(10).nullish(),
    honeyStores: zod_1.z.number().int().min(0).max(10).nullish(),
    pollenStores: zod_1.z.number().int().min(0).max(10).nullish(),
    queenCells: zod_1.z.number().int().min(0).nullish(),
    swarmCells: zod_1.z.boolean().nullish(),
    supersedureCells: zod_1.z.boolean().nullish(),
    queenSeen: zod_1.z.boolean().nullish(),
});
