import { describe, expect, it } from "vitest";
import { randomBetween } from "../services/award-coins-services";

describe("randomBetween", ()=> {
    it("gibt eine zahl zwischen min und max zurück", () =>{
        const result = randomBetween(1,3);

        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(3);
    });
});