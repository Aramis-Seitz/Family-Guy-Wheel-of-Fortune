import { getJson, postJson, deleteJson, getCurrentUserId } from "./api-helpers";
import {
    SelectResponseSchema,
    SavedWheelResponseSchema,
    AssetsResponseSchema,
} from "shared";
import type { SavedWheel, Asset } from "shared";

export type SelectAssetResult = {
    success: boolean;
    assetId: string;
};

export async function getOwnedAssets(): Promise<Asset[]> {
    const userId = await getCurrentUserId();
    const rawBody = await getJson(`/api/users/${userId}/inventory/assets`, {
        errorFallbackKey: "api.inventory.loadAssetsFailed"
    });
    const body = AssetsResponseSchema.parse(rawBody);
    return body.assets;
}

export async function getSelectedAssets(): Promise<Asset[]> {
    const userId = await getCurrentUserId();
    const rawBody = await getJson(`/api/users/${userId}/inventory/selected-assets`, {
        errorFallbackKey: "api.inventory.loadAssetIdsFailed"
    });
    const body = AssetsResponseSchema.parse(rawBody);
    return body.assets;
}

export async function selectAsset(assetId: string): Promise<SelectAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const userId = await getCurrentUserId();
    const rawBody = await postJson(`/api/users/${userId}/inventory/selected-assets`, { assetId }, {
        errorFallbackKey: "api.inventory.selectAssetFailed"
    });
    const body = SelectResponseSchema.parse(rawBody);

    return {
        success: body.success,
        assetId: body.assetId,
    };
}

export async function deleteSavedWheel(wheelId: string): Promise<void> {
    const userId = await getCurrentUserId();
    await deleteJson(`/api/users/${userId}/saved-wheels/${wheelId}`, {
        errorFallbackKey: "api.inventory.deleteWheelFailed"
    });
}

export async function getSavedWheels(): Promise<SavedWheel[]> {
    const userId = await getCurrentUserId();
    const rawBody = await getJson(`/api/users/${userId}/saved-wheels`, {
        errorFallbackKey: "api.inventory.loadWheelsFailed",
    });
    const body = SavedWheelResponseSchema.parse(rawBody);
    return body.savedWheels;
}

export async function saveSavedWheels(title: string, url: string): Promise<void> {
    const userId = await getCurrentUserId();
    await postJson(`/api/users/${userId}/saved-wheels`, { title, url }, {
        errorFallbackKey: "api.inventory.saveFailed",
    });
}