"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectResponseSchema = exports.SavedWheelResponseSchema = exports.SavedWheelSchema = void 0;
const zod_1 = require("zod");
exports.SavedWheelSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    link: zod_1.z.string().nullable(),
    created_at: zod_1.z.string(),
});
exports.SavedWheelResponseSchema = zod_1.z.object({
    savedWheels: zod_1.z.array(exports.SavedWheelSchema),
});
exports.SelectResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    assetId: zod_1.z.string(),
});
