import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { AppError } from "../lib/errors";
import { insertSpinToken, findSpinTokenNamesInWheel, markSpinTokenUsed } from "../repositories/room-repository";
import type { RoomPlayer, NameInWheel } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";
import { formatDisplayName } from "../lib/display-name";
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

// Ordnet jedem Namen auf dem Rad genau einmal die Account-UUID zu, die dazu
// gehört — im Multiplayer über die Mitspielerliste des Raums (Host und Gäste
// sind dort gleichermaßen echte User), im Solo-Modus nur den Spinner selbst.
// Alles andere ist ein von Hand eingetragener Name ohne Account: userId null.
// Bewusst hier und nicht erst beim Award, damit die Zuordnung an dem Rad hängt,
// das tatsächlich gedreht wurde, und der Client sie nicht mitschicken muss.
function resolveNamesInWheel(names: string[], accountsByUsername: Map<string, string>): NameInWheel[] {
    return names.map((username) => ({
        username,
        userId: accountsByUsername.get(username) ?? null,
    }));
}

export async function generateSpin(userId: string, names: string[], roomPlayers: RoomPlayer[] = []): Promise<SpinRandomResponseBody> {
    const spinnerProfile = await getUserProfile(userId);
    const accountsByUsername = new Map<string, string>(roomPlayers.map((player) => [player.username, player.id]));
    if (spinnerProfile?.username) {
        accountsByUsername.set(spinnerProfile.username, userId);
    }

    const ranNum = getRandomWheelSpinNumber();
    const spinToken = await insertSpinToken(randomUUID(), userId, resolveNamesInWheel(names, accountsByUsername));
    return { ranNum, spinToken };
}

export async function awardCoins(userId: string, spinToken: string, winnerIndex: number): Promise<AwardCoinsResponseBody> {
    const namesInWheel = await findSpinTokenNamesInWheel(spinToken, userId);
    if (!namesInWheel) {
        throw new AppError("Invalid or already used spin token", 403);
    }

    await markSpinTokenUsed(spinToken);

    const spinnerCoins = getRandomSpinnerCoins();
    const spinnerProfile = await getUserProfile(userId);
    const spinnerName = spinnerProfile
        ? formatDisplayName(spinnerProfile.username, spinnerProfile.suffix)
        : userId;

    // Der Gewinner steht ausschließlich über den Index im gespeicherten Rad fest.
    const winner = namesInWheel[winnerIndex];
    if (!winner) {
        throw new AppError("Winner is not part of this spin", 400);
    }

    const winnerUserId = winner.userId;
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
        console.log(`[coins] Winner: ${winner.username} → +${winnerCoins} Coins`);
        return { spinnerCoins, winnerCoins };
    }

    console.log(`[coins] Winner: ${winner.username} → kein Account, keine Coins`);
    return { spinnerCoins, winnerCoins: 0 };
}
