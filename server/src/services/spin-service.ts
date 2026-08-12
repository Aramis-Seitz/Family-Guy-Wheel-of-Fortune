import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import {
    getProfileByUserId,
    getUserIdByUsername,
} from "../repositories/profile-repository";
import { insertSpinToken, findValidSpinToken, markSpinTokenUsed } from "../repositories/room-repository";
import { addCoins } from "./user-service";
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
    const spinnerProfile = await getProfileByUserId(userId);
    const spinnerName = spinnerProfile?.username ?? userId;

    const winnerUserId = await getUserIdByUsername(winnerName);
    const spinnerIsWinner = winnerUserId === userId;

    if (spinnerIsWinner) {
        const winnerCoins = getRandomWinnerCoins();
        await addCoins(userId, spinnerCoins + winnerCoins);
        console.log(`[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins, total: spinnerCoins + winnerCoins };
    }

    await addCoins(userId, spinnerCoins);
    console.log(`[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`);

    if (winnerUserId) {
        const winnerCoins = getRandomWinnerCoins();
        await addCoins(winnerUserId, winnerCoins);
        console.log(`[coins] Winner: ${winnerName} → +${winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins };
    }

    console.log(`[coins] Winner: ${winnerName} → nicht im System, keine Coins`);
    return { spinnerCoins, winnerCoins: 0 };
}
