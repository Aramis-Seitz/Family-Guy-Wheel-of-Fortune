import { z } from "zod";
import { AchievementWithProgressSchema, UnlockedAchievementSchema } from "./achievement";

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

export const PurchaseResponseSchema = z.object({
    success: z.literal(true),
    coins: z.number(),
    assetId: z.string(),
    unlockedAchievements: z.array(UnlockedAchievementSchema),
    progressedAchievements: z.array(AchievementWithProgressSchema),
});
export type PurchaseResponseBody = z.infer<typeof PurchaseResponseSchema>;
