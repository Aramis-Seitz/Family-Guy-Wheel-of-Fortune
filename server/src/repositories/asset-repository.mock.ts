import { store } from "../mock/store";
import { AppError } from "../lib/errors";
import type * as Real from "./asset-repository.real";
import type { Asset } from "shared";
import type { AssetCategory } from "./asset-repository.shared";

export const listAssets: typeof Real.listAssets = async () => {
    return [...store.asset].sort((a, b) => a.name.localeCompare(b.name));
};

export const getAssetById: typeof Real.getAssetById = async (assetId) => {
    return store.asset.find((a) => a.id === assetId) ?? null;
};

export const listOwnedAssets: typeof Real.listOwnedAssets = async (userId) => {
    return store.asset_ownership
        .filter((o) => o.user_id === userId)
        .map((o) => store.asset.find((a) => a.id === o.asset_id))
        .filter((a): a is Asset => !!a);
};

export const listSelectedAssetIds: typeof Real.listSelectedAssetIds = async (userId) => {
    return store.asset_selection.filter((s) => s.user_id === userId).map((s) => s.asset_id);
};

export const listAssetCategories: typeof Real.listAssetCategories = async () => {
    return [...new Set(store.asset.map((a) => a.category))];
};

export const userOwnsAsset: typeof Real.userOwnsAsset = async (userId, assetId) => {
    return store.asset_ownership.some((o) => o.user_id === userId && o.asset_id === assetId);
};

export const createAssetOwnership: typeof Real.createAssetOwnership = async (userId, assetId) => {
    store.asset_ownership.push({ user_id: userId, asset_id: assetId });
};

export const userSelectedAsset: typeof Real.userSelectedAsset = async (userId, assetId) => {
    return store.asset_selection.some((s) => s.user_id === userId && s.asset_id === assetId);
};

function upsertSelection(userId: string, category: AssetCategory, assetId: string): void {
    const existing = store.asset_selection.find((s) => s.user_id === userId && s.category === category);
    if (existing) existing.asset_id = assetId;
    else store.asset_selection.push({ user_id: userId, category, asset_id: assetId });
}

export const assignDefaultAssets: typeof Real.assignDefaultAssets = async (userId) => {
    const assets = store.asset.filter((a) => ["Peter Laugh", "Quagmire"].includes(a.name));
    if (assets.length === 0) throw new AppError("Default-Assets nicht gefunden", 500);

    for (const asset of assets) {
        if (!store.asset_ownership.some((o) => o.user_id === userId && o.asset_id === asset.id)) {
            store.asset_ownership.push({ user_id: userId, asset_id: asset.id });
        }
        upsertSelection(userId, asset.category, asset.id);
    }
};

export const createAssetSelection: typeof Real.createAssetSelection = async (userId, assetId) => {
    const asset = store.asset.find((a) => a.id === assetId);
    if (!asset) throw new AppError("Asset konnte nicht gefunden werden", 404);
    upsertSelection(userId, asset.category, assetId);
};
