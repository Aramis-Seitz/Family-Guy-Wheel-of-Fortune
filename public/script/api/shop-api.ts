import { getJson, postJson } from "./api-helpers";
import { AssetsResponseSchema, AssetIdsResponseSchema, PurchaseResponseSchema } from "shared";
import type { Asset } from "shared";

export type PurchaseAssetResult = {
    success: boolean;
    coins: number | null;
    assetId: string;
};

export async function getShopAssets(): Promise<Asset[]> {
    const rawBody = await getJson("/api/shop/assets", {
        errorFallbackKey: "api.shop.loadAssetsFailed"
    });
    const body = AssetsResponseSchema.parse(rawBody);
    return body.assets;
}

export async function getOwnedAssetIds(): Promise<string[]> {
    const rawBody = await getJson("/api/shop/owned-asset-ids", {
        errorFallbackKey: "api.shop.loadOwnedFailed"
    });
    const body = AssetIdsResponseSchema.parse(rawBody);
    return body.assetIds;
}

export async function purchaseAsset(assetId: string): Promise<PurchaseAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const rawBody = await postJson("/api/shop/purchase", { assetId }, {
        errorFallbackKey: "shop.purchaseFailed"
    });
    const body = PurchaseResponseSchema.parse(rawBody);

    return {
        success: body.success,
        coins: body.coins,
        assetId: body.assetId,
    };
}
