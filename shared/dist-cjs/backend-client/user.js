"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileResponseSchema = exports.CoinsResponseSchema = void 0;
const zod_1 = require("zod");
exports.CoinsResponseSchema = zod_1.z.object({
    coins: zod_1.z.number(),
});
exports.ProfileResponseSchema = zod_1.z.object({
    profile: zod_1.z.object({
        username: zod_1.z.string(),
        coins: zod_1.z.number(),
    }),
});
