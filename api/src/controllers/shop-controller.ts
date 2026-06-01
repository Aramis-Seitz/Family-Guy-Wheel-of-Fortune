import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getAssets, getOwnedAssets, purchaseAsset } from "../services/shop-service";
import { sendMethodNotAllowed, sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

type PurchaseRequestBody = {
    assetId?: string;
};

export async function handleGetShopAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res, "GET");
        return;
    }

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

export async function handleGetOwnedAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res, "GET");
        return;
    }

    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assets = await getOwnedAssets(userId);
        res.status(200).json({ assets });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handlePurchaseShopAsset(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "POST") {
        sendMethodNotAllowed(res, "POST");
        return;
    }

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
