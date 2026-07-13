import { getJson, postJson, ApiError } from "./api-helpers";
import { CoinsResponseSchema, ProfileResponseSchema } from "shared";

export async function getUserCoins(): Promise<number> {
    const rawBody = await getJson("/api/user/coins", {
        errorFallback: "Coins konnten nicht geladen werden"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}

export async function getUserProfile(): Promise<{ username: string; coins: number } | null> {
    let rawBody: unknown;
    try {
        rawBody = await getJson("/api/user/profile", {
            errorFallback: "Profil konnte nicht geladen werden"
        });
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }

    const body = ProfileResponseSchema.parse(rawBody);
    return body.profile;
}

export async function setUserCoins(coins: number): Promise<number> {
    const rawBody = await postJson("/api/user/coins", { coins }, {
        errorFallback: "Failed to set coins"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}

export async function ensureDefaultAssets(): Promise<void> {
    await postJson("/api/user/ensure-defaults", undefined, {
        errorFallback: "Default-Assets konnten nicht gesetzt werden"
    });
}

export async function subtractUserCoins(amount: number): Promise<number> {
    const rawBody = await postJson("/api/user/subtract-coins", { amount }, {
        errorFallback: "Failed to subtract coins"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}
