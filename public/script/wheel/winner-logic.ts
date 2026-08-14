export const POINTER_OFFSET_DEG: number = 270;
export const FULL_CIRCLE_DEG: number = 360;

export function getSegmentIndex(rotation: number, segmentCount: number): number {
  const stepAngle = FULL_CIRCLE_DEG / segmentCount;
  const pointerAngle = ((POINTER_OFFSET_DEG - rotation) % FULL_CIRCLE_DEG + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  return Math.floor(pointerAngle / stepAngle) % segmentCount;
}

export function resolveWinner(rotation: number, names: string[]): string {
  return names[getSegmentIndex(rotation, names.length)];
}
