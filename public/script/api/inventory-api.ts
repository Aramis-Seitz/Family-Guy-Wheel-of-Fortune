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
        errorFallback: "Assets konnten nicht geladen werden"
    });
    const body = AssetsResponseSchema.parse(rawBody);
    return body.assets;
}

export async function getSelectedAssetIds(): Promise<string[]> {
    const rawBody = await getJson("/api/inventory/selected-asset-ids", {
        errorFallback: "Asset-Ids konnten nicht geladen werden"
    });
    const body = AssetIdsResponseSchema.parse(rawBody);
    return body.assetIds;
}

export async function selectAsset(assetId: string): Promise<SelectAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const rawBody = await postJson("/api/inventory/select", { assetId }, {
        errorFallback: "Asset konnte nicht ausgewählt werden"
    });
    const body = SelectResponseSchema.parse(rawBody);

    return {
        success: body.success,
        assetId: body.assetId,
    };
}

export async function deleteSavedWheel(wheelId: string): Promise<void> {
    await postJson("/api/inventory/delete-saved-wheel", { wheelId }, {
        errorFallback: "Rad konnte nicht gelöscht werden."
    });
}

export async function getSavedWheels(): Promise<SavedWheel[]> {
    const rawBody = await getJson("/api/inventory/saved-wheels", {
        errorFallback: "Räder konnten nicht geladen werden",
    });
    const body = SavedWheelResponseSchema.parse(rawBody);
    return body.savedWheels;
}

export async function saveSavedWheels(title: string, url: string): Promise<void> {
    await postJson("/api/inventory/save-saved-wheel", { title, url }, {
        errorFallback: "Speichern fehlgeschlagen. Bitte versuche es erneut.",
    });
}