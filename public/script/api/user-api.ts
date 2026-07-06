import { getJson, postJson, ApiError } from "./api-helpers.js";


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
    const body = await getJson<CoinsResponseBody>("/api/user/coins", {
        errorFallback: "Coins konnten nicht geladen werden"
    });
    return typeof body.coins === "number" ? body.coins : 0;
}

export async function getUserProfile(): Promise<{ username: string; coins: number } | null> {
    let body: ProfileResponseBody;
    try {
        body = await getJson<ProfileResponseBody>("/api/user/profile", {
            errorFallback: "Profil konnte nicht geladen werden"
        });
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }

    const profile = body.profile;
    if (!profile || typeof profile.username !== "string") return null;

    return {
        username: profile.username,
        coins: typeof profile.coins === "number" ? profile.coins : 0
    };
}

export async function setUserCoins(coins: number): Promise<number> {
    const body = await postJson<CoinsResponseBody>("/api/user/coins", { coins }, {
        errorFallback: "Failed to set coins"
    });
    return typeof body.coins === "number" ? body.coins : 0;
}

export async function ensureDefaultAssets(): Promise<void> {
    await postJson("/api/user/ensure-defaults", undefined, {
        errorFallback: "Default-Assets konnten nicht gesetzt werden"
    });
}

export async function subtractUserCoins(amount: number): Promise<number> {
    const body = await postJson<CoinsResponseBody>("/api/user/subtract-coins", { amount }, {
        errorFallback: "Failed to subtract coins"
    });
    return typeof body.coins === "number" ? body.coins : 0;
}
