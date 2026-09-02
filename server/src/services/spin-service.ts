import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import { insertSpinToken, findAwardableSpin, markSpinTokenUsed } from "../repositories/room-repository";
import type { RoomPlayer, NameInWheel } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";
import { resolveSpinWinner, type SpinDirection } from "../lib/wheel-winner";
import type { SpinRandomResponseBody, AwardCoinsResponseBody } from "shared";

export type SpinParams = { multiplier: number; direction: SpinDirection };

function getRandomWheelSpinNumber(): number {
    return getSecureRandomNumber(0, 359);
}

function getRandomSpinnerCoins(): number {
    return getSecureRandomNumber(1, 3);
}

function getRandomWinnerCoins(): number {
    return getSecureRandomNumber(3, 6);
}

function resolveNamesInWheel(names: string[], accountsByUsername: Map<string, string>): NameInWheel[] {
    return names.map((username) => ({
        username,
        userId: accountsByUsername.get(username) ?? null,
    }));
}

export async function generateSpin(
    userId: string,
    names: string[],
    { multiplier, direction }: SpinParams,
    roomPlayers: RoomPlayer[] = [],
): Promise<SpinRandomResponseBody> {

    if (names.length < 2) {
        throw new AppError("A spin needs at least two names", 400);
    }

    const spinnerProfile = await getUserProfile(userId);
    const accountsByUsername = new Map<string, string>(roomPlayers.map((player) => [player.username, player.id]));

    if (spinnerProfile?.username) {
        accountsByUsername.set(spinnerProfile.username, userId);
    }

    const { ranNum, winnerIndex } = resolveSpinWinner(getRandomWheelSpinNumber(), multiplier, direction, names.length);
    const spinToken = await insertSpinToken(
        randomUUID(),
        userId,
        resolveNamesInWheel(names, accountsByUsername),
        winnerIndex,
    );
    return { ranNum, spinToken, winnerName: names[winnerIndex] ?? "" };
}

export async function awardCoins(userId: string, spinToken: string): Promise<AwardCoinsResponseBody> {
    const spin = await findAwardableSpin(spinToken, userId);
    if (!spin) {
        throw new AppError("Invalid or already used spin token", 403);
    }

    await markSpinTokenUsed(spinToken);

    const spinnerCoins = getRandomSpinnerCoins();
    const spinnerProfile = await getUserProfile(userId);
    const spinnerName = spinnerProfile
        ? formatDisplayName(
            spinnerProfile.username,
            spinnerProfile.suffix
        )
        : userId;

    const winner = spin.winnerIndex === null ? undefined : spin.namesInWheel[spin.winnerIndex];
    if (!winner) {
        throw new AppError("Winner is not part of this spin", 400);
    }

    const winnerUserId = winner.userId;
    const spinnerIsWinner = winnerUserId === userId;

    if (spinnerIsWinner) {
        const winnerCoins = getRandomWinnerCoins();
        await addCoins(userId, spinnerCoins + winnerCoins);

        console.log(
            `[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins`
        );

        return {
            spinnerCoins,
            winnerCoins,
            total: spinnerCoins + winnerCoins
        };
    }

    await addCoins(userId, spinnerCoins);

    console.log(
        `[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`
    );

    if (winnerUserId) {
        const winnerCoins = getRandomWinnerCoins();
        await addCoins(winnerUserId, winnerCoins);
        console.log(`[coins] Winner: ${winner.username} → +${winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins };
    }

    console.log(`[coins] Winner: ${winner.username} → kein Account, keine Coins`);
    return { spinnerCoins, winnerCoins: 0 };
}
