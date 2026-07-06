import { getJson, postJson } from "./api-helpers.js";
import type { Asset, AssetCategory } from "../shared/types.js";


type AssetsResponseBody = {
    assets?: Asset[];
};

type OwnedAssetIdsResponseBody = {
    assetIds?: string[];
};

type PurchaseResponseBody = {
    success?: boolean;
    coins?: number;
    assetId?: string;
};


export type PurchaseAssetResult = {
    success: boolean;
    coins: number | null;
    assetId: string;
};

export async function getShopAssets(): Promise<Asset[]> {
    const body = await getJson<AssetsResponseBody>("/api/shop/assets", {
        errorFallback: "Shop-Assets konnten nicht geladen werden"
    });
    return Array.isArray(body.assets) ? body.assets : [];
}

export async function getOwnedAssetIds(): Promise<string[]> {
    const body = await getJson<OwnedAssetIdsResponseBody>("/api/shop/owned-asset-ids", {
        errorFallback: "Asset-IDs konnten nicht geladen werden"
    });
    return Array.isArray(body.assetIds) ? body.assetIds : [];
}

export async function purchaseAsset(assetId: string): Promise<PurchaseAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const body = await postJson<PurchaseResponseBody>("/api/shop/purchase", { assetId }, {
        errorFallback: "Asset konnte nicht gekauft werden"
    });

    return {
        success: body.success === true,
        coins: typeof body.coins === "number" ? body.coins : null,
        assetId: typeof body.assetId === "string" && body.assetId ? body.assetId : assetId
    };
}
