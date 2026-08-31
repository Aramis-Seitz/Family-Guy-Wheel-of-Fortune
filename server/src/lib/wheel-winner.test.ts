import { describe, it, expect } from "vitest";
import { getSegmentIndex, resolveSpinWinner, type SpinDirection } from "./wheel-winner";

function clientLandingRotation(degrees: number, multiplier: number, direction: SpinDirection): number {
    const sign = direction === "right" ? 1 : -1;
    return sign * (Math.round(1800 * multiplier) + degrees);
}

const MAX_ANIMATION_OVERSHOOT_DEG = 0.5;

describe("getSegmentIndex", () => {
    it("maps a rotation to the segment under the pointer fixed at 270 degrees", () => {
        const segmentCount = 4;

        const atRest = getSegmentIndex(0, segmentCount);
        const quarterTurn = getSegmentIndex(90, segmentCount);
        const halfTurn = getSegmentIndex(180, segmentCount);
        const threeQuarterTurn = getSegmentIndex(270, segmentCount);

        expect(atRest).toBe(3);
        expect(quarterTurn).toBe(2);
        expect(halfTurn).toBe(1);
        expect(threeQuarterTurn).toBe(0);
    });

    it("gives the same segment after any number of whole extra turns", () => {
        const rotation = 123;

        const withSevenExtraTurns = getSegmentIndex(rotation + 360 * 7, 8);

        expect(withSevenExtraTurns).toBe(getSegmentIndex(rotation, 8));
    });

    it("accepts the negative rotation produced by a left spin", () => {
        const leftSpin = getSegmentIndex(-90, 4);

        expect(leftSpin).toBe(getSegmentIndex(270, 4));
    });
});

describe("resolveSpinWinner", () => {
    it.each<{ multiplier: number; direction: SpinDirection; segments: number }>([
        { multiplier: 1, direction: "right", segments: 2 },
        { multiplier: 1, direction: "left", segments: 5 },
        { multiplier: 1.25, direction: "right", segments: 8 },
        { multiplier: 2, direction: "left", segments: 16 },
    ])("resolves a spin (x$multiplier, $direction, $segments segments) to a consistent winner", ({ multiplier, direction, segments }) => {
        const rawDegrees = 137;

        const { ranNum, winnerIndex } = resolveSpinWinner(rawDegrees, multiplier, direction, segments);

        expect(winnerIndex).toBeGreaterThanOrEqual(0);
        expect(winnerIndex).toBeLessThan(segments);
        expect(ranNum).toBeGreaterThanOrEqual(0);
        expect(ranNum).toBeLessThan(360);
        expect(getSegmentIndex(clientLandingRotation(ranNum, multiplier, direction), segments)).toBe(winnerIndex);
    });

    it("returns a mid-segment degree unchanged and reads off the segment under the pointer", () => {
        const rawDegrees = 45;

        const result = resolveSpinWinner(rawDegrees, 1, "right", 4);

        expect(result).toStrictEqual({ ranNum: 45, winnerIndex: 2 });
    });

    it("nudges a degree that would otherwise land exactly on a segment border", () => {
        const rawDegrees = 0;

        const result = resolveSpinWinner(rawDegrees, 1, "right", 4);

        expect(result).toStrictEqual({ ranNum: 2, winnerIndex: 2 });
    });

    it("keeps the winner stable against the client animation's sub-degree overshoot", () => {
        const rawDegrees = 89;
        const segments = 4;

        const { ranNum, winnerIndex } = resolveSpinWinner(rawDegrees, 1, "right", segments);

        const landing = clientLandingRotation(ranNum, 1, "right");
        expect(getSegmentIndex(landing, segments)).toBe(winnerIndex);
        expect(getSegmentIndex(landing + MAX_ANIMATION_OVERSHOOT_DEG, segments)).toBe(winnerIndex);
        expect(getSegmentIndex(landing - MAX_ANIMATION_OVERSHOOT_DEG, segments)).toBe(winnerIndex);
    });
});
