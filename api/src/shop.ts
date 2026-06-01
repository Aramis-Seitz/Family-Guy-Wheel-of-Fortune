import type { Asset } from "./types/asset";
import {
  getAssets as getAssetsService,
  getOwnedAssets as getOwnedAssetsService,
  purchaseAsset
} from "./services/shop-service";

export async function getAssets(): Promise<Asset[]> {
  return getAssetsService();
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
  const assets = await getAssetsService();
  const asset = assets.find((currentAsset) => currentAsset.id === assetId);
  return asset ?? null;
}

export async function getPriceByAssetId(assetId: string): Promise<number | null> {
  const asset = await getAssetById(assetId);
  return asset ? asset.price_coins : null;
}

export async function getOwnedAssets(userId: string): Promise<Asset[]> {
  return getOwnedAssetsService(userId);
}

export async function buyAsset(assetId: string, userId: string): Promise<void> {
  await purchaseAsset(userId, assetId);
}
