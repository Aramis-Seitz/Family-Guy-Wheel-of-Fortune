import { z } from "zod";
import { supabaseClient } from "../lib/supabase-client";
import { AppError } from "../lib/errors";
import type { Asset } from "shared";

export const AssetCategorySchema = z.enum(["sound", "companion"]);
export type AssetCategory = z.infer<typeof AssetCategorySchema>;

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

type AssetOwnershipRow = {
    asset?: Asset | Asset[] | null;
};

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
    const { data, error } = await supabaseClient
        .from("asset_ownership")
        .select("asset_id")
        .eq("user_id", userId)
        .eq("asset_id", assetId)
        .single();
    return !error && !!data;
}

export async function createAssetOwnership(userId: string, assetId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("asset_ownership")
        .insert({ user_id: userId, asset_id: assetId });

    if (error) throw error;
}

export async function userSelectedAsset(userId: string, assetId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
        .from("asset_selection")
        .select("asset_id")
        .eq("user_id", userId)
        .eq("asset_id", assetId)
        .single();
    return !error && !!data;
}

export async function assignDefaultAssets(userId: string): Promise<void> {
    const { data: assets, error: assetsError } = await supabaseClient
        .from("asset")
        .select("id, category")
        .in("name", ["Peter Laugh", "Quagmire"]);

    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) throw new AppError("Default-Assets nicht gefunden", 500);

    const ownershipRows = assets.map((a) => ({ user_id: userId, asset_id: a.id }));
    const { error: ownershipError } = await supabaseClient
        .from("asset_ownership")
        .upsert(ownershipRows, { onConflict: "user_id,asset_id", ignoreDuplicates: true });
    if (ownershipError) throw ownershipError;

    const selectionRows = assets.map((a) => ({ user_id: userId, asset_id: a.id, category: a.category }));
    const { error: selectionError } = await supabaseClient
        .from("asset_selection")
        .upsert(selectionRows, { onConflict: "user_id,category", ignoreDuplicates: true });
    if (selectionError) throw selectionError;
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