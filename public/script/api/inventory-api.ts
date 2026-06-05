import { supabaseClient } from "../shared/supabase-client.js";
import type { Asset } from "../shared/types.js";
import { apiUrl } from "../shared/api-base.js";

type ApiErrorBody = {
    error?: string;
};

type AssetsResponseBody = {
    assets?: Asset[];
};

type AssetIdsResponseBody = {
    assetIds?: string[];
};

type SelectResponseBody = {
    success?: boolean;
    assetId?: string;
};

export type SelectAssetResult = {
    success: boolean;
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

export async function getOwnedAssets(): Promise<Asset[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/inventory/assets"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Assets konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as AssetsResponseBody;
    return Array.isArray(body.assets) ? body.assets : [];
}

export async function getSelectedAssetIds(): Promise<string[]> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/inventory/selected-asset-ids"), {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Asset-Ids konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as AssetIdsResponseBody;
    return Array.isArray(body.assetIds) ? body.assetIds : [];
}

export async function selectAsset(assetId: string): Promise<SelectAssetResult> {
    if (!assetId) {
        throw new Error("assetId is required");
    }

    const headers = await buildAuthHeaders({
        "Content-Type": "application/json",
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/inventory/select"), {
        method: "POST",
        headers,
        body: JSON.stringify({ assetId })
    });

    if (!response.ok) {
        const message = await readApiError(response, "Asset konnte nicht ausgewählt werden");
        throw new Error(message);
    }

    const body = await response.json() as SelectResponseBody;
    return {
        success: body.success !== false,
        assetId: typeof body.assetId === "string" && body.assetId ? body.assetId : assetId
    };
}