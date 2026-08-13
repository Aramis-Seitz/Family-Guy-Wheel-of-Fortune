import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import { getUserIdByUsername } from "../repositories/profile-repository";
import { insertSpinToken, findValidSpinToken, markSpinTokenUsed } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";
import { incrementProgress } from "./achievement-service";
import type { SpinRandomResponseBody, AwardCoinsResponseBody } from "shared";

function getRandomWheelSpinNumber(): number {
    return getSecureRandomNumber(0, 359);
}

function getRandomSpinnerCoins(): number {
    return getSecureRandomNumber(1, 3);
}

function getRandomWinnerCoins(): number {
    return getSecureRandomNumber(3, 6);
}

export async function generateSpin(userId: string): Promise<SpinRandomResponseBody> {
    const ranNum = getRandomWheelSpinNumber();
    const spinToken = await insertSpinToken(randomUUID(), userId);
    return { ranNum, spinToken };
}

export async function awardCoins(userId: string, spinToken: string, winnerName: string): Promise<AwardCoinsResponseBody> {
    const isValid = await findValidSpinToken(spinToken, userId);
    if (!isValid) {
        throw new AppError("Invalid or already used spin token", 403);
    }

    await markSpinTokenUsed(spinToken);

    const spinnerCoins = getRandomSpinnerCoins();
    const spinnerProfile = await getUserProfile(userId);
    const spinnerName = spinnerProfile?.username ?? userId;

    const winnerUserId = await getUserIdByUsername(winnerName);
    const spinnerIsWinner = winnerUserId === userId;

    // Zählt nur den Spin des Aufrufers (nicht den evtl. abweichenden Gewinner) -
    // dessen etwaige eigenen Unlocks bekommt der Gewinner-Client separat über
    // die Realtime-Subscription auf user_achievement_unlocked mit.
    const spinResult = await incrementProgress(userId, "spin", 1);

    if (spinnerIsWinner) {
        const winnerCoins = getRandomWinnerCoins();
        const { unlockedAchievements, progressedAchievements } = await addCoins(userId, spinnerCoins + winnerCoins);
        console.log(`[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins`);
        return {
            spinnerCoins,
            winnerCoins,
            total: spinnerCoins + winnerCoins,
            unlockedAchievements: dedupeById([...spinResult.unlocked, ...unlockedAchievements]),
            progressedAchievements: dedupeById([...spinResult.progressed, ...progressedAchievements]),
        };
    }

    const { unlockedAchievements: spinnerUnlocks, progressedAchievements: spinnerProgressed } = await addCoins(userId, spinnerCoins);
    console.log(`[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`);

    if (winnerUserId) {
        const winnerCoins = getRandomWinnerCoins();
        await addCoins(winnerUserId, winnerCoins);
        console.log(`[coins] Winner: ${winnerName} → +${winnerCoins} Coins`);
        return {
            spinnerCoins,
            winnerCoins,
            unlockedAchievements: dedupeById([...spinResult.unlocked, ...spinnerUnlocks]),
            progressedAchievements: dedupeById([...spinResult.progressed, ...spinnerProgressed]),
        };
    }

    console.log(`[coins] Winner: ${winnerName} → nicht im System, keine Coins`);
    return {
        spinnerCoins,
        winnerCoins: 0,
        unlockedAchievements: dedupeById([...spinResult.unlocked, ...spinnerUnlocks]),
        progressedAchievements: dedupeById([...spinResult.progressed, ...spinnerProgressed]),
    };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}
