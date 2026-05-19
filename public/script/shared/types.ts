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

export type ToastType = "success" | "error";

export interface ToastOptions {
  message: string;
  type: ToastType;
  durationMs?: number;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  price: number;
  assetUrl: string;
  isOwned: boolean;
  isActive: boolean;
}

export interface ShopData {
  asset: Asset[];
  userCoins: number;
}

export type AssetCategory = "sound" | "companion";
