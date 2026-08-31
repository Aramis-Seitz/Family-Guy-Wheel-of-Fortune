import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSpin, awardCoins } from "./spin-service";

vi.mock("crypto", () => ({
    randomUUID: vi.fn(),
}));

vi.mock("../lib/random", () => ({
    getSecureRandomNumber: vi.fn(),
}));

vi.mock("../repositories/room-repository", () => ({
    insertSpinToken: vi.fn(),
    findAwardableSpin: vi.fn(),
    markSpinTokenUsed: vi.fn(),
}));

vi.mock("./user-service", () => ({
    addCoins: vi.fn(),
    getUserProfile: vi.fn(),
}));

import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { insertSpinToken, findAwardableSpin, markSpinTokenUsed } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";

const userId = "user-123";
const generatedUuid = "11111111-1111-1111-1111-111111111111";
const spinParams = { multiplier: 1, direction: "right" as const };

beforeEach(() => {
    vi.clearAllMocks();
});

describe("generateSpin", () => {
    beforeEach(() => {
        vi.mocked(randomUUID).mockReturnValue(generatedUuid);
        vi.mocked(getSecureRandomNumber).mockReturnValue(180);
        vi.mocked(insertSpinToken).mockResolvedValue("persisted-spin-token");
        vi.mocked(getUserProfile).mockResolvedValue({ username: "spinner" } as never);
    });

    it("returns the landing degree, the persisted token and the server-chosen winner", async () => {
        const result = await generateSpin(userId, ["spinner", "Stewie"], spinParams);

        expect(result).toStrictEqual({
            ranNum: 180,
            spinToken: "persisted-spin-token",
            winnerName: "spinner",
        });
    });

    it("persists the generated token id together with the resolved winner index", async () => {
        await generateSpin(userId, ["spinner", "Stewie"], spinParams);

        expect(insertSpinToken).toHaveBeenCalledWith(
            generatedUuid,
            userId,
            [
                { username: "spinner", userId },
                { username: "Stewie", userId: null },
            ],
            0,
        );
    });

    it("returns the landing degree and winner name for the segment index it persists", async () => {
        vi.mocked(getSecureRandomNumber).mockReturnValue(45);

        const result = await generateSpin(userId, ["a", "b", "c", "d"], spinParams);

        expect(result.ranNum).toBe(45);
        expect(result.winnerName).toBe("c");
        expect(insertSpinToken).toHaveBeenCalledWith(generatedUuid, userId, expect.anything(), 2);
    });

    it("resolves room players to their accounts and hand-typed names to no account", async () => {
        const roomPlayers = [
            { id: userId, username: "spinner" },
            { id: "guest-1", username: "Brian" },
        ];

        await generateSpin(userId, ["spinner", "Brian", "Quagmire"], spinParams, roomPlayers);

        expect(insertSpinToken).toHaveBeenCalledWith(
            generatedUuid,
            userId,
            [
                { username: "spinner", userId },
                { username: "Brian", userId: "guest-1" },
                { username: "Quagmire", userId: null },
            ],
            expect.any(Number),
        );
    });

    it("rejects a spin with fewer than two names without issuing a token", async () => {
        await expect(generateSpin(userId, ["solo"], spinParams)).rejects.toMatchObject({ statusCode: 400 });
        await expect(generateSpin(userId, [], spinParams)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("propagates the error when the spin token cannot be persisted", async () => {
        vi.mocked(insertSpinToken).mockRejectedValueOnce(new Error("database unavailable"));

        const result = generateSpin(userId, ["spinner", "Stewie"], spinParams);

        await expect(result).rejects.toThrow("database unavailable");
    });
});

describe("awardCoins", () => {
    const spinToken = "spin-token";

    beforeEach(() => {
        vi.mocked(getSecureRandomNumber).mockReturnValue(3);
        vi.mocked(getUserProfile).mockResolvedValue({ username: "spinner" } as never);
    });

    it("rejects an unknown, foreign or already-used token with 403 and pays out nothing", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce(null);

        const result = awardCoins(userId, spinToken);

        await expect(result).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects a token that carries no winner index with 400 and pays out nothing", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [{ username: "Brian", userId: "guest-1" }],
            winnerIndex: null,
        });

        const result = awardCoins(userId, spinToken);

        await expect(result).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects a stored winner index outside the wheel with 400 and pays out nothing", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [{ username: "Brian", userId: "guest-1" }],
            winnerIndex: 5,
        });

        const result = awardCoins(userId, spinToken);

        await expect(result).rejects.toMatchObject({ statusCode: 400 });
    });

    it("awards coins to both the spinner and the winner when the winner has an account", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [
                { username: "spinner", userId },
                { username: "Brian", userId: "guest-1" },
            ],
            winnerIndex: 1,
        });

        const result = await awardCoins(userId, spinToken);

        expect(addCoins).toHaveBeenCalledWith(userId, 3);
        expect(addCoins).toHaveBeenCalledWith("guest-1", 3);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 3 });
    });

    it("awards the spinner only when the winning name has no account", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [{ username: "Quagmire", userId: null }],
            winnerIndex: 0,
        });

        const result = await awardCoins(userId, spinToken);

        expect(addCoins).toHaveBeenCalledExactlyOnceWith(userId, 3);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 0 });
    });

    it("awards the combined amount in one booking when the spinner wins their own spin", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [{ username: "spinner", userId }],
            winnerIndex: 0,
        });

        const result = await awardCoins(userId, spinToken);

        expect(addCoins).toHaveBeenCalledExactlyOnceWith(userId, 6);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 3, total: 6 });
    });

    it("consumes the token so the same spin cannot pay out twice", async () => {
        vi.mocked(findAwardableSpin).mockResolvedValueOnce({
            namesInWheel: [{ username: "Brian", userId: "guest-1" }],
            winnerIndex: 0,
        });

        await awardCoins(userId, spinToken);

        expect(markSpinTokenUsed).toHaveBeenCalledExactlyOnceWith(spinToken);
    });
});
