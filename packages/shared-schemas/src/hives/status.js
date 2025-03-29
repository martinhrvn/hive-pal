"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hiveStatusSchema = exports.HiveStatus = void 0;
const zod_1 = require("zod");
var HiveStatus;
(function (HiveStatus) {
    HiveStatus["ACTIVE"] = "ACTIVE";
    HiveStatus["INACTIVE"] = "INACTIVE";
    HiveStatus["DEAD"] = "DEAD";
    HiveStatus["SOLD"] = "SOLD";
    HiveStatus["UNKNOWN"] = "UNKNOWN";
    HiveStatus["ARCHIVED"] = "ARCHIVED";
})(HiveStatus || (exports.HiveStatus = HiveStatus = {}));
exports.hiveStatusSchema = zod_1.z.nativeEnum(HiveStatus);
