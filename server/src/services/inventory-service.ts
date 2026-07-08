import type { Asset } from "../repositories/asset-repository";
import { AppError } from "../lib/errors";
import {
    listOwnedAssets,
    userSelectedAsset,
    getAssetById,
    createAssetSelection,
} from "../repositories/asset-repository";
import { deleteWheelById, listSavedWheels, insertSavedWheels } from "../repositories/wheel-repository"
import { SavedWheel } from "../repositories/wheel-repository";

export async function getOwnedAssets(userId: string): Promise<Asset[]> {
    return listOwnedAssets(userId);
}

export type SelectResult = {
    success: true;
    assetId: string;
};

export async function selectAsset(userId: string, assetId: string): Promise<SelectResult> {
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

export type DeleteResult = {
    success: true;
}

export async function deleteWheel(userId: string, wheelId: string): Promise<DeleteResult> {
    await deleteWheelById(userId, wheelId);
    return { success: true };
}

export async function getSavedWheels(userId: string): Promise<SavedWheel[]> {
    return listSavedWheels(userId);
}

export type SaveSavedWheelResult = {
    success: true;
};

export async function saveSavedWheels(userId: string, title: string, url: string): Promise<SaveSavedWheelResult> {
    await insertSavedWheels(userId, title, url);
    return { success: true };
}