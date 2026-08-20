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
    findSpinTokenNamesInWheel: vi.fn(),
    markSpinTokenUsed: vi.fn(),
}));

vi.mock("./user-service", () => ({
    addCoins: vi.fn(),
    getUserProfile: vi.fn(),
}));

import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { insertSpinToken, findSpinTokenNamesInWheel, markSpinTokenUsed } from "../repositories/room-repository";
import { addCoins, getUserProfile } from "./user-service";

const userId = "user-123";
const generatedUuid = "11111111-1111-1111-1111-111111111111";

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

    it("returns the wheel number and the token persisted by insertSpinToken", async () => {
        const result = await generateSpin(userId, []);

        expect(result).toStrictEqual({
            ranNum: 180,
            spinToken: "persisted-spin-token",
        });
    });

    it("persists a freshly generated UUID for the given user", async () => {
        await generateSpin(userId, []);

        expect(insertSpinToken).toHaveBeenCalledWith(generatedUuid, userId, []);
    });

    it("resolves the spinner's own name to their account, everyone else to null in solo", async () => {
        await generateSpin(userId, ["Stewie", "spinner"]);

        expect(insertSpinToken).toHaveBeenCalledWith(generatedUuid, userId, [
            { username: "Stewie", userId: null },
            { username: "spinner", userId },
        ]);
    });

    it("resolves room players to their accounts and hand-typed names to null", async () => {
        await generateSpin(userId, ["spinner", "Brian", "Quagmire"], [
            { id: userId, username: "spinner" },
            { id: "guest-1", username: "Brian" },
        ]);

        expect(insertSpinToken).toHaveBeenCalledWith(generatedUuid, userId, [
            { username: "spinner", userId },
            { username: "Brian", userId: "guest-1" },
            { username: "Quagmire", userId: null },
        ]);
    });

    it("propagates an error when persisting the spin token fails", async () => {
        vi.mocked(insertSpinToken).mockRejectedValueOnce(new Error("database unavailable"));

        const result = generateSpin(userId, []);

        await expect(result).rejects.toThrow("database unavailable");
    });
});

describe("awardCoins", () => {
    const spinToken = "spin-token";

    beforeEach(() => {
        vi.mocked(getSecureRandomNumber).mockReturnValue(3);
        vi.mocked(getUserProfile).mockResolvedValue({ username: "spinner" } as never);
    });

    it("wirft 403, wenn der token ungueltig oder schon verbraucht ist", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce(null);

        const result = awardCoins(userId, spinToken, 0);

        await expect(result).rejects.toMatchObject({ statusCode: 403 });
        expect(markSpinTokenUsed).not.toHaveBeenCalled();
        expect(addCoins).not.toHaveBeenCalled();
    });

    it("gibt dem gewinner coins, wenn er ein echter user ist", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce([
            { username: "Brian", userId: "guest-1" },
        ]);

        const result = await awardCoins(userId, spinToken, 0);

        expect(addCoins).toHaveBeenCalledWith(userId, 3);
        expect(addCoins).toHaveBeenCalledWith("guest-1", 3);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 3 });
    });

    it("gibt keine coins an einen von hand eingetragenen namen, der spinner bekommt seine trotzdem", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce([
            { username: "Quagmire", userId: null },
        ]);

        const result = await awardCoins(userId, spinToken, 0);

        expect(addCoins).toHaveBeenCalledExactlyOnceWith(userId, 3);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 0 });
    });

    it("bucht spinner- und gewinner-coins zusammen, wenn der spinner selbst gewinnt", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce([
            { username: "spinner", userId },
        ]);

        const result = await awardCoins(userId, spinToken, 0);

        expect(addCoins).toHaveBeenCalledExactlyOnceWith(userId, 6);
        expect(result).toStrictEqual({ spinnerCoins: 3, winnerCoins: 3, total: 6 });
    });

    it("wirft 400, wenn der index ausserhalb des gespeicherten rads liegt", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce([
            { username: "Brian", userId: "guest-1" },
        ]);

        const result = awardCoins(userId, spinToken, 5);

        await expect(result).rejects.toMatchObject({ statusCode: 400 });
        expect(addCoins).not.toHaveBeenCalled();
    });

    it("verbraucht den token, damit derselbe spin nicht zweimal coins gibt", async () => {
        vi.mocked(findSpinTokenNamesInWheel).mockResolvedValueOnce([
            { username: "Brian", userId: "guest-1" },
        ]);

        await awardCoins(userId, spinToken, 0);

        expect(markSpinTokenUsed).toHaveBeenCalledExactlyOnceWith(spinToken);
    });
});
