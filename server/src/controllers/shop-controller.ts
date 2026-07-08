import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getAssets, getOwnedAssetIds, getAssetCategories, purchaseAsset } from "../services/shop-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";

export async function handleGetShopAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assets = await getAssets();
        res.status(200).json({ assets });
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
        res.status(200).json({ assetIds });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleGetAssetCategories(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const categories = await getAssetCategories();
        res.status(200).json({ categories });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

type PurchaseRequestBody = {
    assetId?: string;
};

export async function handlePurchaseShopAsset(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = (req.body ?? {}) as PurchaseRequestBody;
        const result = await purchaseAsset(userId, String(body.assetId ?? ""));

        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
