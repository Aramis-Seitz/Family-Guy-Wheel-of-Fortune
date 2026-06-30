import { ASSET_CATEGORIES, INVENTORY_CATEGORIES } from "./constants.js";

export type Direction = "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface RandomResponse {
  ranNum: number;
  spinToken: string;
}

export interface AwardCoinsResponse {
  spinnerCoins: number;
  winnerCoins: number;
  total?: number;
}

export interface SpinConfig {
  totalSteps: number;
  direction: Direction;
  stepAngle: number;
  segmentCount: number;
  spinToken: string;
  names: string[];
}

export type SpinHandler = (direction: Direction) => Promise<void>;

export type SpinElement = HTMLButtonElement | HTMLInputElement | NodeListOf<HTMLButtonElement>;

export interface SpinFrameState {
  distanceTravelled: number;
  readonly sign: number;
}

export interface ProfileData {
  username: string;
  coins: number;
}

export type InventoryItem = {
  id: string;
  title: string;
  link: string | null;
  created_at: string;
};

export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  message: string;
  type: ToastType;
  durationMs?: number;
}

export interface RoomSpinResponse {
  ranNum: number;
  spinToken: string;
  direction: Direction;
}

export interface RoomPlayer {
  id: string;
  username: string;
}

export interface RoomRow {
  last_spin: number;
  spun_at: string;
  players: RoomPlayer[];
  wheel_items?: string[];
  multiplier: number;
  spin_direction: string | null;
}

export type AssetCategory = typeof ASSET_CATEGORIES[number];

export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export type Asset = {
  readonly id: string;
  readonly name: string;
  readonly category: AssetCategory;
  readonly price_coins: number;
  readonly asset_url: string;
}

export interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}