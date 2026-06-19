//import { get } from "node:http";
import { AssetCategory, Point } from "./types.js";

// ─── Rad & Geometrie ───────────────────────────────────────────────────────────

export const SVG_NS = "http://www.w3.org/2000/svg";

export const WHEEL_CENTER: Point = { x: 100, y: 100 };
export const WHEEL_RADIUS: number = 100;
export const MINI_CENTER = { x: 100, y: 100 };
export const MINI_RADIUS = 90;

export const FULL_CIRCLE_RADIANS: number = Math.PI * 2;
export const FULL_CIRCLE_DEG: number = 360;
export const POINTER_OFFSET_DEG: number = 270;

export const MIN_ITEMS: number = 2;
export const MAX_ITEMS: number = 16;

export const SEGMENT_COLORS: string[] = [
  "#f4d87e",
  "#f4a96b",
  "#f4a0a0",
  "#a8d8f0",
  "#c5b8f0",
  "#ae945d",
  "#8a78c5",
  "#745bc6",
  "#312260",
  "#1f1542",
  "#3c287b",
  "rgb(141, 116, 225)",
  "#504672",
];

// ─── Spin-Animation ────────────────────────────────────────────────────────────

export const MAX_SPIN_VELOCITY: number = 15;
export const MIN_SPIN_VELOCITY: number = 0.5;
export const MIN_SPIN_ROTATIONS: number = 5 * 360;
export const DEFAULT_MULTIPLIER: number = 1;

export const SPIN_FAST_PHASE_RATIO: number = 0.15;
export const SPIN_EASE_EXPONENT: number = 1.4;
export const SPIN_START_DELAY: number = 5;
export const SPIN_END_DELAY: number = 65;
export const SPIN_DISABLED_OPACITY: string = "0.5";

export const DRUMROLL_LEAD_IN_STEPS: number = 321;
export const DRUMROLL_DELAY_THRESHOLD = 30;

// ─── Inventar & Assets ─────────────────────────────────────────────────────────

export const INVENTORY_LIMIT: number = 12;

export const ASSET_CATEGORIES: string[] = ["sound", "companion"] as const;
export const INVENTORY_CATEGORIES: string[] = ["wheel", ...ASSET_CATEGORIES] as const;

export const EMPTY_STATE_THUMBNAIL_SOUND: string = "../../assets/default-thumbnail-sound-asset.png";
export const EMPTY_STATE_THUMBNAIL_COMPANION: string = "../../assets/default-thumbnail-companion-asset.png";

export const EMPTY_STATE_THUMBNAIL_BY_CATEGORY: Partial<Record<AssetCategory, string>> = {
  sound: EMPTY_STATE_THUMBNAIL_SOUND,
  companion: EMPTY_STATE_THUMBNAIL_COMPANION,
};
