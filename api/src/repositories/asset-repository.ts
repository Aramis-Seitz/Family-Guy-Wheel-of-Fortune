import { supabaseClient } from "../lib/supabase-client";
import type { Asset, AssetCategory } from "../types/asset";
import { AppError } from "../services/errors";

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
        .select("asset:asset_id(id, name, category, price_coins, asset_url)")
        .eq("user_id", userId);

    if (error) throw error;

    const rows = (data ?? []) as AssetOwnershipRow[];
    return rows
        .map((row) => row.asset)
        .flatMap((asset) => (Array.isArray(asset) ? asset : asset ? [asset] : []));
}

export async function listSelectedAssetIds(userId: string): Promise<string[]> {
    const { data, error } = await supabaseClient
        .from("asset_selection")
        .select("asset_id")
        .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).map((row) => row.asset_id as string);
}

export async function listAssetCategories(): Promise<AssetCategory[]> {
    const { data, error } = await supabaseClient
        .from("asset")
        .select("category");

    if (error) throw error;

    return [...new Set((data ?? []).map((row) => row.category as AssetCategory))];
}

export async function userOwnsAsset(userId: string, assetId: string): Promise<boolean> {
    const ownedAssets = await listOwnedAssets(userId);
    return ownedAssets.map(asset => asset.id).includes(assetId);
}

export async function createAssetOwnership(userId: string, assetId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("asset_ownership")
        .insert({ user_id: userId, asset_id: assetId });

    if (error) throw error;
}

export async function userSelectedAsset(userId: string, assetId: string): Promise<boolean> {
    const selectedAssetIds = await listSelectedAssetIds(userId);
    return selectedAssetIds.includes(assetId);
}

export async function createAssetSelection(userId: string, assetId: string): Promise<void> {
    const asset = await getAssetById(assetId);

    if (!asset) throw new AppError("Asset konnte nicht gefunden werden", 404);

    const { error } = await supabaseClient
        .from('asset_selection')
        .upsert(
            {
                user_id: userId,
                asset_id: assetId,
                category: asset.category,
            },
            {
                onConflict: 'user_id,category'
            }
        );

    if (error) {
        console.error('Upsert error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw new AppError(`Asset konnte nicht erfolgreich ausgewählt werden: ${error.message}`, 500);
    }
}