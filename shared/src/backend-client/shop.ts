import { z } from "zod";

export const AssetSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(["sound", "companion"]),
    price_coins: z.number(),
    asset_url: z.string(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const AssetsResponseSchema = z.object({
    assets: z.array(AssetSchema),
});
export type AssetsResponseBody = z.infer<typeof AssetsResponseSchema>;

export const AssetIdsResponseSchema = z.object({
    assetIds: z.array(z.string()),
});
export type AssetIdsResponseBody = z.infer<typeof AssetIdsResponseSchema>;

export const PurchaseResponseSchema = z.object({
    success: z.literal(true),
    coins: z.number(),
    assetId: z.string(),
});
export type PurchaseResponseBody = z.infer<typeof PurchaseResponseSchema>;
