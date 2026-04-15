export type Direction = "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface RandomResponse {
  ranNum: number;
}

export interface SpinConfig {
  totalSteps: number;
  direction: Direction;
  stepAngle: number;
  segmentCount: number;
}
