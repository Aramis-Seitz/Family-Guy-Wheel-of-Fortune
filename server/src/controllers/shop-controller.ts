import { z } from "zod";
import { getAssets, getOwnedAssetIds, getAssetCategories, purchaseAsset } from "../services/shop-service";
import { asyncHandler, sendCodedError } from "./response";
import { ERROR_CODES } from "../lib/error-codes";
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
        sendCodedError(res, 400, "assetId is required", ERROR_CODES.VALIDATION, { field: "assetId" });
        return;
    }

    const result = await purchaseAsset(req.userId!, parsedBody.data.assetId);
    res.status(200).json(PurchaseResponseSchema.parse(result));
});
