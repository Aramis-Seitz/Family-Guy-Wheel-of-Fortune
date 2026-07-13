import { z } from "zod";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getOwnedAssets, selectAsset, getSavedWheels } from "../services/inventory-service";
import { getSelectedAssetIds } from "../services/shop-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { deleteWheel } from "../services/inventory-service";
import { saveSavedWheels } from "../services/inventory-service";
import {
    SavedWheelResponseSchema,
    AssetsResponseSchema,
    AssetIdsResponseSchema,
    SelectResponseSchema,
} from "shared";

export async function handleGetOwnedAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assets = await getOwnedAssets(userId);
        res.status(200).json(AssetsResponseSchema.parse({ assets }));
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
        res.status(200).json(AssetIdsResponseSchema.parse({ assetIds }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SelectRequestSchema = z.object({
    assetId: z.string().min(1),
});

export async function handleSelectAsset(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SelectRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "assetId is required" });
            return;
        }

        const result = await selectAsset(userId, parsedBody.data.assetId);

        res.status(200).json(SelectResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const DeleteWheelRequestSchema = z.object({
    wheelId: z.string().min(1),
});

export async function handleDeleteWheel(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = DeleteWheelRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "id is required" });
            return;
        }
        await deleteWheel(userId, parsedBody.data.wheelId);

        res.status(200).json({ ok: true });
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
        res.status(200).json(SavedWheelResponseSchema.parse({ savedWheels }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SaveSavedWheelRequestSchema = z.object({
    title: z.string().min(1),
    url: z.string().min(1),
});

export async function handleSaveSavedWheels(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SaveSavedWheelRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "title and url are required" });
            return;
        }

        await saveSavedWheels(userId, parsedBody.data.title, parsedBody.data.url);

        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}