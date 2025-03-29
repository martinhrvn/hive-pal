"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectionStatusSchema = exports.InspectionStatus = void 0;
const zod_1 = require("zod");
var InspectionStatus;
(function (InspectionStatus) {
    InspectionStatus["SCHEDULED"] = "SCHEDULED";
    InspectionStatus["OVERDUE"] = "OVERDUE";
    InspectionStatus["COMPLETED"] = "COMPLETED";
    InspectionStatus["CANCELLED"] = "CANCELLED";
})(InspectionStatus || (exports.InspectionStatus = InspectionStatus = {}));
exports.inspectionStatusSchema = zod_1.z.nativeEnum(InspectionStatus);
