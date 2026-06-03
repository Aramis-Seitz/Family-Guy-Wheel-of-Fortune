import { supabaseClient } from "../shared/supabase-client.js";
import type { Asset, AssetCategory } from "../shared/types.js";
import { apiUrl } from "../shared/api-base.js";

type ApiErrorBody = {
    error?: string;
};

type AssetsResponseBody = {
    assets?: Asset[];
};

type OwnedAssetIdsResponseBody = {
    assetIds?: string[];
};

type AssetCategoriesResponseBody = {
    categories?: AssetCategory[];
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

async function readApiError(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json() as ApiErrorBody;
        if (body.error) return body.error;
    } catch {
        // Keep fallback when response is not valid JSON.
    }
    return fallback;
}

async function buildAuthHeaders(baseHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    return {
        ...baseHeaders,
        Authorization: `Bearer ${token}`
    };
}

export async function getShopAssets(): Promise<Asset[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/shop/assets"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Shop-Assets konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as AssetsResponseBody;
    return Array.isArray(body.assets) ? body.assets : [];
}

export async function getOwnedAssets(): Promise<Asset[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/shop/inventory"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Inventar konnte nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as AssetsResponseBody;
    return Array.isArray(body.assets) ? body.assets : [];
}

export async function getOwnedAssetIds(): Promise<string[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/shop/owned-asset-ids"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Asset-IDs konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as OwnedAssetIdsResponseBody;
    return Array.isArray(body.assetIds) ? body.assetIds : [];
}

export async function getAssetCategories(): Promise<AssetCategory[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/shop/categories"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Kategorien konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as AssetCategoriesResponseBody;
    return Array.isArray(body.categories) ? body.categories : [];

}

export async function purchaseAsset(assetId: string): Promise<PurchaseAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const headers = await buildAuthHeaders({
        "Content-Type": "application/json",
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/shop/purchase"), {
        method: "POST",
        headers,
        body: JSON.stringify({ assetId })
    });

    if (!response.ok) {
        const message = await readApiError(response, "Asset konnte nicht gekauft werden");
        throw new Error(message);
    }

    const body = await response.json() as PurchaseResponseBody;
    return {
        success: body.success !== false,
        coins: typeof body.coins === "number" ? body.coins : null,
        assetId: typeof body.assetId === "string" && body.assetId ? body.assetId : assetId
    };
}

