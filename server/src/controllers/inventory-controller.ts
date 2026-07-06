import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getOwnedAssets, selectAsset, getSavedWheels } from "../services/inventory-service";
import { getSelectedAssetIds } from "../services/shop-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";
import { deleteWheel } from "../services/inventory-service";

type SelectRequestBody = {
    assetId?: string;
};

type DeleteWheelRequestBody = {
    wheelId?: string
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

export async function handleDeleteWheel(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = (req.body ?? {}) as DeleteWheelRequestBody;
        const wheelId = String(body.wheelId ?? "");
        if (!wheelId) {
            res.status(400).json({ error: "id is required" });
            return;
        }
        const result = await deleteWheel(userId, wheelId);

        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleGetSavedWheels(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const savedWheels = await getSavedWheels(userId);
        res.status(200).json({ savedWheels });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}