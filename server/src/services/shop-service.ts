import {
    createAssetOwnership,
    getAssetById,
    listAssets,
    userOwnsAsset
} from "../repositories/asset-repository";
import { getCoinsByUserId } from "../repositories/profile-repository";
import { subtractCoins } from "./user-service";
import { AppError } from "../lib/errors";
import type { Asset, PurchaseResponseBody } from "shared";

export async function getAssets(): Promise<Asset[]> {
    return listAssets();
}

export async function purchaseAsset(userId: string, assetId: string): Promise<PurchaseResponseBody> {
    if (!assetId) {
        throw new AppError("assetId is required", 400);
    }

    const asset = await getAssetById(assetId);
    if (!asset) {
        throw new AppError("Asset not found", 404);
    }

    const alreadyOwned = await userOwnsAsset(userId, assetId);
    if (alreadyOwned) {
        throw new AppError("Asset already owned", 409);
    }

    const currentCoins = await getCoinsByUserId(userId);
    if (currentCoins < asset.price_coins) {
        throw new AppError("Not enough coins", 422);
    }

    await createAssetOwnership(userId, assetId);

    const remainingCoins = await subtractCoins(userId, asset.price_coins);

    return {
        success: true,
        coins: remainingCoins,
        assetId
    };
}