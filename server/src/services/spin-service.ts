import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import {
    getProfileByUserId,
    getCoinsByUserId,
    updateCoinsByUserId,
    getUserIdByUsername,
} from "../repositories/profile-repository";
import { insertSpinToken, findValidSpinToken, markSpinTokenUsed } from "../repositories/room-repository";

const MIN_ROTATION_DEGREE = 0;
const MAX_ROTATION_DEGREE = 359;

export type AwardCoinsResult = {
    spinnerCoins: number;
    winnerCoins: number;
    total?: number;
};

export async function generateSpin(userId: string): Promise<{ ranNum: number; spinToken: string }> {
    const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
    const token = randomUUID();
    const spinToken = await insertSpinToken(token, userId);
    return { ranNum, spinToken };
}

export async function awardCoins(userId: string, spinToken: string, winnerName: string): Promise<AwardCoinsResult> {
    const isValid = await findValidSpinToken(spinToken, userId);
    if (!isValid) {
        throw new AppError("Invalid or already used spin token", 403);
    }

    await markSpinTokenUsed(spinToken);

    const spinnerCoins = getSecureRandomNumber(1, 3);
    const spinnerProfile = await getProfileByUserId(userId);
    const spinnerName = spinnerProfile?.username ?? userId;

    const winnerUserId = await getUserIdByUsername(winnerName);
    const spinnerIsWinner = winnerUserId === userId;

    if (spinnerIsWinner) {
        const winnerCoins = getSecureRandomNumber(3, 6);
        await addCoins(userId, spinnerCoins + winnerCoins);
        console.log(`[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins, total: spinnerCoins + winnerCoins };
    }

    await addCoins(userId, spinnerCoins);
    console.log(`[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`);

    if (winnerUserId) {
        const winnerCoins = getSecureRandomNumber(3, 6);
        await addCoins(winnerUserId, winnerCoins);
        console.log(`[coins] Winner: ${winnerName} → +${winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins };
    }

    console.log(`[coins] Winner: ${winnerName} → nicht im System, keine Coins`);
    return { spinnerCoins, winnerCoins: 0 };
}

async function addCoins(userId: string, amount: number): Promise<void> {
    const currentCoins = await getCoinsByUserId(userId);
    await updateCoinsByUserId(userId, currentCoins + amount);
}
