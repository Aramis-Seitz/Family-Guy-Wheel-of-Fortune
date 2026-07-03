import { readApiError, buildAuthHeaders } from "./api-helpers.js";
import { apiUrl } from "../shared/api-base.js";


type CoinsResponseBody = {
    coins?: number;
};

type ProfileResponseBody = {
    profile?: {
        username?: string;
        coins?: number;
    };
};


export async function getUserCoins(): Promise<number> {
    const headers = await buildAuthHeaders({
        "Accept": "application/json"
    });

    const response = await fetch(apiUrl("/api/user/coins"), {
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

    const response = await fetch(apiUrl("/api/user/profile"), {
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

    const response = await fetch(apiUrl("/api/user/coins"), {
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

export async function ensureDefaultAssets(): Promise<void> {
    const headers = await buildAuthHeaders();

    const response = await fetch(apiUrl("/api/user/ensure-defaults"), {
        method: "POST",
        headers
    });

    if (!response.ok) {
        const message = await readApiError(response, "Default-Assets konnten nicht gesetzt werden");
        throw new Error(message);
    }
}

export async function subtractUserCoins(amount: number): Promise<number> {
    const headers = await buildAuthHeaders({
        "Content-Type": "application/json"
    });

    const response = await fetch(apiUrl("/api/user/subtract-coins"), {
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
