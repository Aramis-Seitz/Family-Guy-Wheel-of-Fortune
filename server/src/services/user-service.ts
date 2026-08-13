import {
    getCoinsByUserId,
    getProfileByUserId,
    insertProfile,
    updateCoinsByUserId,
} from "../repositories/profile-repository";
import type { Profile } from "../repositories/profile-repository";
import { assignDefaultAssets } from "../repositories/asset-repository";
import { incrementProgress } from "./achievement-service";
import { AppError } from "../lib/errors";
import type { AchievementWithProgress, UnlockedAchievement } from "shared";

export interface AddCoinsResult {
    newBalance: number;
    unlockedAchievements: UnlockedAchievement[];
    progressedAchievements: AchievementWithProgress[];
}

export async function getUserCoins(userId: string): Promise<number> {
    return getCoinsByUserId(userId);
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
    return getProfileByUserId(userId);
}

export async function addCoins(userId: string, amount: number): Promise<AddCoinsResult> {
    const currentCoins = await getCoinsByUserId(userId);
    const newBalance = currentCoins + amount;
    await updateCoinsByUserId(userId, newBalance);
    const { unlocked, progressed } = await incrementProgress(userId, "coins_total", amount);
    return { newBalance, unlockedAchievements: unlocked, progressedAchievements: progressed };
}

export async function subtractCoins(userId: string, amount: number): Promise<number> {
    const currentCoins = await getCoinsByUserId(userId);
    if (currentCoins < amount) {
        throw new AppError("Not enough coins", 400);
    }

    const newBalance = currentCoins - amount;
    await updateCoinsByUserId(userId, newBalance);
    return newBalance;
}

export async function registerUser(userId: string, username: string, email: string, dateOfBirth: string): Promise<void> {
    await insertProfile(userId, username, email, dateOfBirth);
    await assignDefaultAssets(userId);
}

export async function ensureDefaultAssets(userId: string): Promise<void> {
    await assignDefaultAssets(userId);
}
