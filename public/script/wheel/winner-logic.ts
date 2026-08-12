import type { SpinConfig } from "./spin";

export const POINTER_OFFSET_DEG: number = 270;
export const FULL_CIRCLE_DEG: number = 360;

export function resolveWinner(rotation: number, config: SpinConfig): string {
  const pointerAngle = ((POINTER_OFFSET_DEG - rotation) % FULL_CIRCLE_DEG + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  const winnerIndex = Math.floor(pointerAngle / config.stepAngle) % config.segmentCount;
  return config.names[winnerIndex] ?? config.names[0];
}
