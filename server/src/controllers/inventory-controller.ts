import { z } from "zod";
import { getOwnedAssets, selectAsset, getSavedWheels } from "../services/inventory-service";
import { getSelectedAssetIds } from "../services/shop-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { deleteWheel } from "../services/inventory-service";
import { saveSavedWheels } from "../services/inventory-service";
import {
    SavedWheelResponseSchema,
    AssetsResponseSchema,
    AssetIdsResponseSchema,
    SelectResponseSchema,
} from "shared";

export const handleGetOwnedAssets = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const assets = await getOwnedAssets(req.userId!);
    res.status(200).json(AssetsResponseSchema.parse({ assets }));
});

export const handleGetSelectedAssetIds = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const assetIds = await getSelectedAssetIds(req.userId!);
    res.status(200).json(AssetIdsResponseSchema.parse({ assetIds }));
});

const SelectRequestSchema = z.object({
    assetId: z.string().min(1),
});

export const handleSelectAsset = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SelectRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "assetId is required" });
        return;
    }

    const result = await selectAsset(req.userId!, parsedBody.data.assetId);

    res.status(200).json(SelectResponseSchema.parse(result));
});

const DeleteWheelRequestSchema = z.object({
    wheelId: z.string().min(1),
});

export const handleDeleteWheel = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = DeleteWheelRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "id is required" });
        return;
    }
    await deleteWheel(req.userId!, parsedBody.data.wheelId);

    res.status(200).json({ ok: true });
});

export const handleGetSavedWheels = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const savedWheels = await getSavedWheels(req.userId!);
    res.status(200).json(SavedWheelResponseSchema.parse({ savedWheels }));
});

const SaveSavedWheelRequestSchema = z.object({
    title: z.string().min(1),
    url: z.string().min(1),
});

export const handleSaveSavedWheels = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SaveSavedWheelRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "title and url are required" });
        return;
    }

    await saveSavedWheels(req.userId!, parsedBody.data.title, parsedBody.data.url);

    res.status(200).json({ ok: true });
});
