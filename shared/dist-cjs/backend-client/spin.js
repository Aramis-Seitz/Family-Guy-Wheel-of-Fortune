"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwardCoinsResponseSchema = exports.SpinRandomResponseSchema = void 0;
const zod_1 = require("zod");
exports.SpinRandomResponseSchema = zod_1.z.object({
    ranNum: zod_1.z.number(),
    spinToken: zod_1.z.string(),
});
exports.AwardCoinsResponseSchema = zod_1.z.object({
    spinnerCoins: zod_1.z.number(),
    winnerCoins: zod_1.z.number(),
    total: zod_1.z.number().optional(),
});
