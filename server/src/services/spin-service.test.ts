import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSpin } from "./spin-service";

vi.mock("crypto", () => ({
    randomUUID: vi.fn(),
}));

vi.mock("../lib/random", () => ({
    getSecureRandomNumber: vi.fn(),
}));

vi.mock("../repositories/room-repository", () => ({
    insertSpinToken: vi.fn(),
}));

import { randomUUID } from "crypto";
import { getSecureRandomNumber } from "../lib/random";
import { insertSpinToken } from "../repositories/room-repository";

describe("generateSpin", () => {
    const userId = "user-123";
    const generatedUuid = "11111111-1111-1111-1111-111111111111";

    beforeEach(() => {
        vi.mocked(randomUUID).mockReturnValue(generatedUuid);
        vi.mocked(getSecureRandomNumber).mockReturnValue(180);
        vi.mocked(insertSpinToken).mockResolvedValue("persisted-spin-token");
    });

    it("returns the wheel number and the token persisted by insertSpinToken", async () => {
        const result = await generateSpin(userId);

        expect(result).toStrictEqual({
            ranNum: 180,
            spinToken: "persisted-spin-token",
        });
    });

    it("persists a freshly generated UUID for the given user", async () => {
        await generateSpin(userId);

        expect(insertSpinToken).toHaveBeenCalledWith(generatedUuid, userId);
    });

    it("passes through the lower boundary of the wheel range (0) unchanged", async () => {
        vi.mocked(getSecureRandomNumber).mockReturnValue(0);

        const result = await generateSpin(userId);

        expect(result.ranNum).toBe(0);
    });

    it("passes through the upper boundary of the wheel range (359) unchanged", async () => {
        vi.mocked(getSecureRandomNumber).mockReturnValue(359);

        const result = await generateSpin(userId);

        expect(result.ranNum).toBe(359);
    });

    it("propagates an error when persisting the spin token fails", async () => {
        vi.mocked(insertSpinToken).mockRejectedValueOnce(new Error("database unavailable"));

        await expect(generateSpin(userId)).rejects.toThrow("database unavailable");
    });
});
