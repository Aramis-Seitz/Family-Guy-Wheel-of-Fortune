
import { supabaseClient } from "../shared/supabase-client.js";

type ApiErrorBody = {
    error?: string;
};

type CoinsResponseBody = {
    coins?: number;
};

type ProfileResponseBody = {
    profile?: {
        username?: string;
        coins?: number;
    };
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

export async function getUserCoins(): Promise<number> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch("/api/user/coins", {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Coins konnten nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as CoinsResponseBody;
    return typeof body.coins === "number" ? body.coins : 0;
}

export async function getUserProfile(): Promise<{ username: string; coins: number } | null> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch("/api/user/profile", {
        method: "GET",
        headers
    });

    if (response.status === 404) return null;

    if (!response.ok) {
        const message = await readApiError(response, "Profil konnte nicht geladen werden");
        throw new Error(message);
    }

    const body = await response.json() as ProfileResponseBody;
    const profile = body.profile;
    if (!profile || typeof profile.username !== "string") return null;

    return {
        username: profile.username,
        coins: typeof profile.coins === "number" ? profile.coins : 0
    };
}

export async function setUserCoins(coins: number): Promise<number> {
    const headers = await buildAuthHeaders({
        "Content-Type": "application/json"
    });

    const response = await fetch("/api/user/coins", {
        method: "POST",
        headers,
        body: JSON.stringify({ coins })
    });

    if (!response.ok) {
        const message = await readApiError(response, "Failed to set coins");
        throw new Error(message);
    }

    const body = await response.json() as CoinsResponseBody;
    return typeof body.coins === "number" ? body.coins : 0;
}

export async function subtractUserCoins(amount: number): Promise<number> {
    const headers = await buildAuthHeaders({
        "Content-Type": "application/json"
    });

    const response = await fetch("/api/user/subtract-coins", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount })
    });

    if (!response.ok) {
        const message = await readApiError(response, "Failed to subtract coins");
        throw new Error(message);
    }

    const body = await response.json() as CoinsResponseBody;
    return typeof body.coins === "number" ? body.coins : 0;
}
