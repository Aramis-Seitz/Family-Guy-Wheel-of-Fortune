import * as real from "./asset-repository.real";
import * as mock from "./asset-repository.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const impl = USE_MOCK ? mock : real;

export const listAssets = impl.listAssets;
export const getAssetById = impl.getAssetById;
export const listOwnedAssets = impl.listOwnedAssets;
export const listSelectedAssets = impl.listSelectedAssets;
export const listAssetCategories = impl.listAssetCategories;
export const userOwnsAsset = impl.userOwnsAsset;
export const createAssetOwnership = impl.createAssetOwnership;
export const userSelectedAsset = impl.userSelectedAsset;
export const assignDefaultAssets = impl.assignDefaultAssets;
export const createAssetSelection = impl.createAssetSelection;

export { AssetCategorySchema } from "./asset-repository.shared";
export type { AssetCategory } from "./asset-repository.shared";
