import { supabaseClient } from "../lib/supabase-client";
import type { Asset } from "../types/asset";

type AssetOwnershipRow = {
    asset?: Asset | Asset[] | null;
};

export async function listAssets(): Promise<Asset[]> {
    const { data, error } = await supabaseClient
        .from("asset")
        .select("id, name, category, price_coins, asset_url")
        .order("name");

    if (error) throw error;
    return (data ?? []) as Asset[];
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
    const { data, error } = await supabaseClient
        .from("asset")
        .select("id, name, category, price_coins, asset_url")
        .eq("id", assetId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
    }

    return (data ?? null) as Asset | null;
}

export async function listOwnedAssets(userId: string): Promise<Asset[]> {
    const { data, error } = await supabaseClient
        .from("asset_ownership")
        .select("*")
        .eq("user_id", userId);

    if (error) throw error;

    const rows = (data ?? []) as AssetOwnershipRow[];
    return rows
        .map((row) => row.asset)
        .flatMap((asset) => (Array.isArray(asset) ? asset : asset ? [asset] : []));
}

export async function userOwnsAsset(userId: string, assetId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
        .from("asset_ownership")
        .select("asset_id")
        .eq("user_id", userId)
        .eq("asset_id", assetId)
        .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
}

export async function createAssetOwnership(userId: string, assetId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("asset_ownership")
        .insert({ user_id: userId, asset_id: assetId });

    if (error) throw error;
}
