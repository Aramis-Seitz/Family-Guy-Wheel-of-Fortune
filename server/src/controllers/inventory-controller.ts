import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getOwnedAssets, selectAsset } from "../services/inventory-service";
import { getSelectedAssetIds } from "../services/shop-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

type SelectRequestBody = {
    assetId?: string;
};

export async function handleGetOwnedAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
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

export async function handleGetSelectedAssetIds(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assetIds = await getSelectedAssetIds(userId);
        res.status(200).json({ assetIds });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleSelectAsset(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = (req.body ?? {}) as SelectRequestBody;
        const result = await selectAsset(userId, String(body.assetId ?? ""));

        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
