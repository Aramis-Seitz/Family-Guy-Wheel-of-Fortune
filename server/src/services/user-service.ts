import {
    getCoinsByUserId,
    getProfileByUserId,
    insertProfile,
    updateCoinsByUserId,
    type ProfileSummary
} from "../repositories/profile-repository";
import { assignDefaultAssets } from "../repositories/asset-repository";
import { AppError } from "./errors";

export async function getUserCoins(userId: string): Promise<number> {
    return getCoinsByUserId(userId);
}

export async function getUserProfile(userId: string): Promise<ProfileSummary | null> {
    return getProfileByUserId(userId);
}

export async function setUserCoins(userId: string, coins: number): Promise<number> {
    if (!Number.isFinite(coins) || coins < 0) {
        throw new AppError("Invalid coins value", 400);
    }

    await updateCoinsByUserId(userId, coins);
    return coins;
}

export async function registerUser(userId: string, username: string, email: string, dateOfBirth: string): Promise<void> {
    await insertProfile(userId, username, email, dateOfBirth);
    await assignDefaultAssets(userId);
}

export async function ensureDefaultAssets(userId: string): Promise<void> {
    await assignDefaultAssets(userId);
}

export async function subtractUserCoins(userId: string, amount: number): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError("Invalid amount", 400);
    }

    const currentCoins = await getCoinsByUserId(userId);
    if (currentCoins < amount) {
        throw new AppError("Not enough coins", 400);
    }

    const newBalance = currentCoins - amount;
    await updateCoinsByUserId(userId, newBalance);
    return newBalance;
}
