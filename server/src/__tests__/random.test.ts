import { describe, expect, it } from "vitest";
import { getSecureRandomNumber } from "../lib/random";

describe("getSecureRandomNumber", () => {
    it("gibt eine zahl zwischen min und max zurück", () => {
        const result = getSecureRandomNumber(1, 3);

        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(3);
    });
});
