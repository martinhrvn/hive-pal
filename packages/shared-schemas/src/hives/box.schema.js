"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHiveBoxesSchema = exports.boxSchema = exports.boxTypeSchema = exports.BoxTypeEnum = void 0;
const zod_1 = require("zod");
var BoxTypeEnum;
(function (BoxTypeEnum) {
    BoxTypeEnum["BROOD"] = "BROOD";
    BoxTypeEnum["HONEY"] = "HONEY";
    BoxTypeEnum["FEEDER"] = "FEEDER";
})(BoxTypeEnum || (exports.BoxTypeEnum = BoxTypeEnum = {}));
exports.boxTypeSchema = zod_1.z.nativeEnum(BoxTypeEnum);
exports.boxSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    position: zod_1.z.number().int().min(0),
    frameCount: zod_1.z.number().int().min(1),
    hasExcluder: zod_1.z.boolean(),
    type: exports.boxTypeSchema,
    maxFrameCount: zod_1.z.number().int().min(1).optional(),
});
exports.updateHiveBoxesSchema = zod_1.z.object({
    boxes: zod_1.z.array(exports.boxSchema),
});
