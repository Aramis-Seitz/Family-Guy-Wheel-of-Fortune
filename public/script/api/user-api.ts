import { getJson, postJson, ApiError } from "./api-helpers";
import { CoinsResponseSchema, ProfileResponseSchema } from "shared";

export async function getUserCoins(): Promise<number> {
    const rawBody = await getJson("/api/user/coins", {
        errorFallbackKey: "api.user.loadCoinsFailed"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}

export async function getUserProfile(): Promise<{ username: string; coins: number } | null> {
    let rawBody: unknown;
    try {
        rawBody = await getJson("/api/user/profile", {
            errorFallbackKey: "api.user.loadProfileFailed"
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
        errorFallbackKey: "api.user.setCoinsFailed"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}

export async function ensureDefaultAssets(): Promise<void> {
    await postJson("/api/user/ensure-defaults", undefined, {
        errorFallbackKey: "api.user.defaultAssetsFailed"
    });
}

export async function subtractUserCoins(amount: number): Promise<number> {
    const rawBody = await postJson("/api/user/subtract-coins", { amount }, {
        errorFallbackKey: "api.user.subtractCoinsFailed"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}
