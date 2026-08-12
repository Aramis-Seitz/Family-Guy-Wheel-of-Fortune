import { getJson, postJson, getCurrentUserId, ApiError } from "../api/api-helpers";
import { CoinsResponseSchema, ProfileResponseSchema } from "shared";

export async function getUserCoins(): Promise<number> {
    const userId = await getCurrentUserId();
    const rawBody = await getJson(`/api/users/${userId}/coins`, {
        errorFallbackKey: "api.user.loadCoinsFailed"
    });
    return CoinsResponseSchema.parse(rawBody).coins;
}

export async function getUserProfile(): Promise<{ username: string; coins: number } | null> {
    const userId = await getCurrentUserId();
    let rawBody: unknown;
    try {
        rawBody = await getJson(`/api/users/${userId}`, {
            errorFallbackKey: "api.user.loadProfileFailed"
        });
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }

    const body = ProfileResponseSchema.parse(rawBody);
    return body.profile;
}

export async function ensureDefaultAssets(): Promise<void> {
    const userId = await getCurrentUserId();
    await postJson(`/api/users/${userId}/inventory/default-assets`, undefined, {
        errorFallbackKey: "api.user.defaultAssetsFailed"
    });
}
