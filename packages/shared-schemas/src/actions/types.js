"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionTypeSchema = exports.ActionType = void 0;
const zod_1 = require("zod");
var ActionType;
(function (ActionType) {
    ActionType["FEEDING"] = "FEEDING";
    ActionType["TREATMENT"] = "TREATMENT";
    ActionType["FRAME"] = "FRAME";
    ActionType["OTHER"] = "OTHER";
})(ActionType || (exports.ActionType = ActionType = {}));
exports.actionTypeSchema = zod_1.z.nativeEnum(ActionType);
