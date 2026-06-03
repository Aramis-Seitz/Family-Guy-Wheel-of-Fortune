import { supabaseClient } from "../shared/supabase-client.js";
import type { Asset } from "../shared/types.js";
import { apiUrl } from "../shared/api-base.js";

type ApiErrorBody = {
    error?: string;
};

type AssetsResponseBody = {
    assets?: Asset[];
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