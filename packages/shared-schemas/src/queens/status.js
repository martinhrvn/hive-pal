"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queenStatusSchema = void 0;
const zod_1 = require("zod");
exports.queenStatusSchema = zod_1.z.enum([
    'ACTIVE',
    'REPLACED',
    'DEAD',
    'UNKNOWN',
]);
