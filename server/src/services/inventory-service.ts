import type { Asset } from "../types/asset";
import {
    listOwnedAssets,
    userSelectedAsset
} from "../repositories/asset-repository";
import { AppError } from "../lib/errors";
import { getAssetById, createAssetSelection } from "../repositories/asset-repository";

export type SelectResult = {
    success: true;
    assetId: string;
};

export async function getOwnedAssets(userId: string): Promise<Asset[]> {
    return listOwnedAssets(userId);
}

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