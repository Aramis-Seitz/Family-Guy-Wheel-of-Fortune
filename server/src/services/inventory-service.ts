import { AppError } from "../lib/errors";
import {
    listOwnedAssets,
    userSelectedAsset,
    getAssetById,
    createAssetSelection,
} from "../repositories/asset-repository";
import { deleteWheelById, listSavedWheels, insertSavedWheels } from "../repositories/wheel-repository"
import type { Asset, SavedWheel, SelectResponseBody } from "shared";

export async function getOwnedAssets(userId: string): Promise<Asset[]> {
    return listOwnedAssets(userId);
}

export async function selectAsset(userId: string, assetId: string): Promise<SelectResponseBody> {
    if (!assetId) {
        throw new AppError("assetId is required", 400);
    }

    const asset = await getAssetById(assetId);
    if (!asset) {
        throw new AppError("Asset not found", 404);
    }

    const alreadySelected = await userSelectedAsset(userId, assetId);
    if (alreadySelected) {
        throw new AppError("Asset already selected", 409);
    }

    await createAssetSelection(userId, assetId);

    return {
        success: true,
        assetId
    };
}

export async function deleteWheel(userId: string, wheelId: string): Promise<void> {
    await deleteWheelById(userId, wheelId);
}

export async function getSavedWheels(userId: string): Promise<SavedWheel[]> {
    return listSavedWheels(userId);
}

export async function saveSavedWheels(userId: string, title: string, url: string): Promise<void> {
    await insertSavedWheels(userId, title, url);
}