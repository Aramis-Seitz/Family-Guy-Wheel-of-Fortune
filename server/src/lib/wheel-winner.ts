export const POINTER_OFFSET_DEG = 270;
export const FULL_CIRCLE_DEG = 360;

const MIN_SPIN_ROTATIONS = 5 * FULL_CIRCLE_DEG;

const OVERSHOOT_MARGIN_DEG = 1.5;

export type SpinDirection = "left" | "right";

function normalizeAngle(angle: number): number {
    return ((angle % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
}

export function getSegmentIndex(rotation: number, segmentCount: number): number {
    const stepAngle = FULL_CIRCLE_DEG / segmentCount;
    const pointerAngle = normalizeAngle(POINTER_OFFSET_DEG - rotation);
    return Math.floor(pointerAngle / stepAngle) % segmentCount;
}

function landingRotation(ranNum: number, multiplier: number, direction: SpinDirection): number {
    const sign = direction === "right" ? 1 : -1;
    return sign * (Math.round(MIN_SPIN_ROTATIONS * multiplier) + ranNum);
}

export function resolveSpinWinner(
    ranNum: number,
    multiplier: number,
    direction: SpinDirection,
    segmentCount: number,
): { ranNum: number; winnerIndex: number } {

    const stepAngle = FULL_CIRCLE_DEG / segmentCount;
    let candidate = normalizeAngle(Math.round(ranNum));

    for (let attempt = 0; attempt < FULL_CIRCLE_DEG; attempt++) {
        const rotation = landingRotation(candidate, multiplier, direction);
        const offsetInSegment = normalizeAngle(POINTER_OFFSET_DEG - rotation) % stepAngle;
        if (offsetInSegment >= OVERSHOOT_MARGIN_DEG && offsetInSegment <= stepAngle - OVERSHOOT_MARGIN_DEG) {
            return { ranNum: candidate, winnerIndex: getSegmentIndex(rotation, segmentCount) };
        }
        candidate = normalizeAngle(candidate + 1);
    }

    const rotation = landingRotation(candidate, multiplier, direction);
    return { ranNum: candidate, winnerIndex: getSegmentIndex(rotation, segmentCount) };
}
