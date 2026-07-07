import { getJson, postJson } from "./api-helpers.js";
import type { Asset, SavedWheel } from "../shared/types.js";


type AssetsResponseBody = {
    assets?: Asset[];
};

type AssetIdsResponseBody = {
    assetIds?: string[];
};

type SelectResponseBody = {
    success?: boolean;
    assetId?: string;
};

type DeleteResponseBody = {
    success?: boolean;
}

export type SelectAssetResult = {
    success: boolean;
    assetId: string;
};

type SavedWheelResponseBody = {
    savedWheels: SavedWheel[];
}

type SaveSavedWheelResponseBody = {
    success: boolean;
    savedWheels?: SavedWheel[];
};

export async function getOwnedAssets(): Promise<Asset[]> {
    const body = await getJson<AssetsResponseBody>("/api/inventory/assets", {
        errorFallback: "Assets konnten nicht geladen werden"
    });
    return Array.isArray(body.assets) ? body.assets : [];
}

export async function getSelectedAssetIds(): Promise<string[]> {
    const body = await getJson<AssetIdsResponseBody>("/api/inventory/selected-asset-ids", {
        errorFallback: "Asset-Ids konnten nicht geladen werden"
    });
    return Array.isArray(body.assetIds) ? body.assetIds : [];
}

export async function selectAsset(assetId: string): Promise<SelectAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const body = await postJson<SelectResponseBody>("/api/inventory/select", { assetId }, {
        errorFallback: "Asset konnte nicht ausgewählt werden"
    });

    return {
        success: body.success === true,
        assetId: typeof body.assetId === "string" && body.assetId ? body.assetId : assetId
    };
}

export async function deleteSavedWheel(wheelId: string): Promise<boolean> {
    const body = await postJson<DeleteResponseBody>("/api/inventory/delete-saved-wheel", { wheelId }, {
        errorFallback: "Rad konnte nicht gelöscht werden."
    });
    return body.success === true;
}

export async function getSavedWheels(): Promise<SavedWheel[]> {
    const body = await getJson<SavedWheelResponseBody>("/api/inventory/saved-wheels", {
        errorFallback: "Räder konnten nicht geladen werden"
    });
    return Array.isArray(body.savedWheels) ? body.savedWheels : [];
}

export async function saveSavedWheels(title: string, url: string): Promise<boolean> {
    const body = await postJson<SaveSavedWheelResponseBody>("/api/inventory/save-saved-wheel", {title, url,}, {
            errorFallback: "Speichern fehlgeschlagen. Bitte versuche es erneut.",
        });
    return body.success === true;
}