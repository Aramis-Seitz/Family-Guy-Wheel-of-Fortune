import { describe, it, expect, vi } from "vitest";
import { generateSpin } from "./spin-service";

vi.mock("../repositories/room-repository", () => ({
    insertSpinToken: vi.fn(),
}));

import { insertSpinToken } from "../repositories/room-repository";

describe("generateSpin", () => {
    it("should generate a random number and insert a spin token", async () => {
        const userId = "user-123";
        const mockSpinToken = "mock-spin-token";
        vi.mocked(insertSpinToken).mockResolvedValueOnce(mockSpinToken);

        const result = await generateSpin(userId);

        expect(insertSpinToken).toHaveBeenCalledWith(expect.any(String), userId);
        expect(result.ranNum).toBeGreaterThanOrEqual(0);
        expect(result.ranNum).toBeLessThanOrEqual(359);
        expect(result.spinToken).toBe(mockSpinToken);
        expect(result).toStrictEqual({
            ranNum: result.ranNum,
            spinToken: mockSpinToken,
        });
    });
});