import { supabaseClient } from "./lib/supabase-client";
import type { Asset } from "../../shared/types";
import { fetchUserCoins } from "./profiles";
import { userManager } from "./lib/user-manager";

export async function getAssets(): Promise<Asset[]> {
    const { data, error } = await supabaseClient
        .from("asset")
        .select("id, name, category, price_coins, asset_url")
        .order("name");

    if (error) throw error;
    return (data ?? []) as Asset[];
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
    const assets = await getAssets();
    const asset = assets.find(a => a.id === assetId);
    return asset ?? null;
}

export async function getPriceByAssetId(assetId: string): Promise<number | null> {
    const asset = await getAssetById(assetId);
    return asset ? asset.price_coins : null;
}

export async function getOwnedAssets(userId: string): Promise<Asset[]> {
    const { data, error } = await supabaseClient
        .from("asset_ownership")
        .select("id, name, category, price_coins, asset_url")
        .eq("user_id", userId)
        .order("name");

    if (error) throw error;
    return (data ?? []) as Asset[];
}

export async function buyAsset(assetId: string, userId: string): Promise<void> {
    const price: number | null = await getPriceByAssetId(assetId);
    const userCoinBalance: number | null = await fetchUserCoins();
    validatePurchase(price, userCoinBalance);
    await setAssetOwnership(assetId, userId);
    await userManager.subtractCoins(price!);

    // Für Debugging
    console.log(`Asset ${assetId} gekauft für User ${userId} zum Preis von ${price} Coins.`);
}

function validatePurchase(price: number | null, userCoinBalance: number | null): boolean {
    if (price === null) throw new Error("Preis konnte nicht ermittelt werden");
    if (userCoinBalance === null) throw new Error("Benutzerkontostand konnte nicht ermittelt werden");
    if (userCoinBalance < price) throw new Error("Nicht genug Coins");
    return true;
}

async function setAssetOwnership(assetId: string, userId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("asset_ownership")
        .insert({
            user_id: userId,
            asset_id: assetId,
        });
    if (error) throw error;
}