"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseResponseSchema = exports.AssetIdsResponseSchema = exports.AssetsResponseSchema = exports.AssetSchema = void 0;
const zod_1 = require("zod");
exports.AssetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    category: zod_1.z.enum(["sound", "companion"]),
    price_coins: zod_1.z.number(),
    asset_url: zod_1.z.string(),
});
exports.AssetsResponseSchema = zod_1.z.object({
    assets: zod_1.z.array(exports.AssetSchema),
});
exports.AssetIdsResponseSchema = zod_1.z.object({
    assetIds: zod_1.z.array(zod_1.z.string()),
});
exports.PurchaseResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    coins: zod_1.z.number(),
    assetId: zod_1.z.string(),
});
