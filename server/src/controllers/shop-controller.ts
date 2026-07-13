import { z } from "zod";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getAssets, getOwnedAssetIds, getAssetCategories, purchaseAsset } from "../services/shop-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    AssetsResponseSchema,
    AssetIdsResponseSchema,
    PurchaseResponseSchema,
} from "shared";
import { AssetCategorySchema } from "../repositories/asset-repository";

export async function handleGetShopAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assets = await getAssets();
        res.status(200).json(AssetsResponseSchema.parse({ assets }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleGetOwnedAssetIds(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assetIds = await getOwnedAssetIds(userId);
        res.status(200).json(AssetIdsResponseSchema.parse({ assetIds }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const AssetCategoriesResponseSchema = z.object({
    categories: z.array(AssetCategorySchema),
});

export async function handleGetAssetCategories(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const categories = await getAssetCategories();
        res.status(200).json(AssetCategoriesResponseSchema.parse({ categories }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const PurchaseRequestSchema = z.object({
    assetId: z.string().min(1),
});

export async function handlePurchaseShopAsset(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = PurchaseRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "assetId is required" });
            return;
        }

        const result = await purchaseAsset(userId, parsedBody.data.assetId);
        res.status(200).json(PurchaseResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
