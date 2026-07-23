import { getJson, postJson } from "./api-helpers";
import {
    SelectResponseSchema,
    SavedWheelResponseSchema,
    AssetsResponseSchema,
    AssetIdsResponseSchema,
} from "shared";
import type { SavedWheel, Asset } from "shared";

export type SelectAssetResult = {
    success: boolean;
    assetId: string;
};

export async function getOwnedAssets(): Promise<Asset[]> {
    const rawBody = await getJson("/api/inventory/assets", {
        errorFallbackKey: "api.inventory.loadAssetsFailed"
    });
    const body = AssetsResponseSchema.parse(rawBody);
    return body.assets;
}

export async function getSelectedAssetIds(): Promise<string[]> {
    const rawBody = await getJson("/api/inventory/selected-asset-ids", {
        errorFallbackKey: "api.inventory.loadAssetIdsFailed"
    });
    const body = AssetIdsResponseSchema.parse(rawBody);
    return body.assetIds;
}

export async function selectAsset(assetId: string): Promise<SelectAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const rawBody = await postJson("/api/inventory/select", { assetId }, {
        errorFallbackKey: "api.inventory.selectAssetFailed"
    });
    const body = SelectResponseSchema.parse(rawBody);

    return {
        success: body.success,
        assetId: body.assetId,
    };
}

export async function deleteSavedWheel(wheelId: string): Promise<void> {
    await postJson("/api/inventory/delete-saved-wheel", { wheelId }, {
        errorFallbackKey: "api.inventory.deleteWheelFailed"
    });
}

export async function getSavedWheels(): Promise<SavedWheel[]> {
    const rawBody = await getJson("/api/inventory/saved-wheels", {
        errorFallbackKey: "api.inventory.loadWheelsFailed",
    });
    const body = SavedWheelResponseSchema.parse(rawBody);
    return body.savedWheels;
}

export async function saveSavedWheels(title: string, url: string): Promise<void> {
    await postJson("/api/inventory/save-saved-wheel", { title, url }, {
        errorFallbackKey: "api.inventory.saveFailed",
    });
}