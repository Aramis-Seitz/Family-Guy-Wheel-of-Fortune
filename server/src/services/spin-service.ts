import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import { insertSpinToken, findValidSpinToken, markSpinTokenUsed } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";
import type { SpinRandomResponseBody, AwardCoinsResponseBody, WheelItem } from "shared";

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

export async function awardCoins(userId: string, spinToken: string, winner: WheelItem): Promise<AwardCoinsResponseBody> {
    if (!winner.uuid) {
        return { spinnerCoins: 0, winnerCoins: 0, total: 0 };
    }

    const isValid = await findValidSpinToken(spinToken, userId);
    if (!isValid) {
        throw new AppError("Invalid or already used spin token", 403);
    }

    await markSpinTokenUsed(spinToken);

    const spinnerCoins = getRandomSpinnerCoins();
    const spinnerProfile = await getUserProfile(userId);
    const spinnerName = spinnerProfile?.username ?? userId;

    const winnerName = winner.username;
    // Usernames are display-only. A guest has no account UUID to reward.
    const winnerUserId = winner.uuid;
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
