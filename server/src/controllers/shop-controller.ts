import { z } from "zod";
import { getAssets, getOwnedAssetIds, getAssetCategories, purchaseAsset } from "../services/shop-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    AssetsResponseSchema,
    AssetIdsResponseSchema,
    PurchaseResponseSchema,
} from "shared";
import { AssetCategorySchema } from "../repositories/asset-repository";

export const handleGetShopAssets = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const assets = await getAssets();
    res.status(200).json(AssetsResponseSchema.parse({ assets }));
});

export const handleGetOwnedAssetIds = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const assetIds = await getOwnedAssetIds(req.userId!);
    res.status(200).json(AssetIdsResponseSchema.parse({ assetIds }));
});

const AssetCategoriesResponseSchema = z.object({
    categories: z.array(AssetCategorySchema),
});

export const handleGetAssetCategories = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const categories = await getAssetCategories();
    res.status(200).json(AssetCategoriesResponseSchema.parse({ categories }));
});

const PurchaseRequestSchema = z.object({
    assetId: z.string().min(1),
});

export const handlePurchaseShopAsset = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = PurchaseRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "assetId is required" });
        return;
    }

    const result = await purchaseAsset(req.userId!, parsedBody.data.assetId);
    res.status(200).json(PurchaseResponseSchema.parse(result));
});
