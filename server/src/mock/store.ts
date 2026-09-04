import { randomUUID } from 'crypto';
import type { Asset, WheelEntry } from 'shared';
import type { AssetCategory } from '../repositories/asset-repository.shared';
import type { NameInWheel } from '../repositories/room-repository.shared';

export interface Profile {
  id: string;
  username: string;
  suffix: number;
  email: string;
  date_of_birth: string | null;
  password: string;
  coins: number;
}

export interface SpinToken {
  token: string;
  user_id: string;
  used: boolean;
  names_in_wheel: NameInWheel[];
  winner_index: number | null;
  created_at: string;
}

export interface SavedLink {
  id: string;
  user_id: string;
  wheel_title: string;
  url: string;
  created_at: string;
}

export type Player = { id: string; username: string; suffix: number };

export interface Room {
  id: string;
  room_key: string;
  host_id: string;
  players: Player[];
  names_in_wheel: WheelEntry[];
  last_spin: number | null;
  spun_at: string | null;
  multiplier: number;
  spin_direction: string | null;
  spin_winner: string | null;
  wheel_reset_at: string | null;
  winner_modal_close_at: string | null;
  created_at: string;
}

export interface AssetOwnership {
  user_id: string;
  asset_id: string;
}

export interface AssetSelection {
  user_id: string;
  category: AssetCategory;
  asset_id: string;
}

export type AchievementCategory = 'spin' | 'shop_purchase' | 'coins_total';

export interface AchievementRow {
  id: string;
  key: string;
  category: AchievementCategory;
  target: number;
  icon_url: string | null;
}

export interface UserAchievementProgressRow {
  user_id: string;
  achievement_id: string;
  progress: number;
  updated_at: string;
}

export interface UserAchievementUnlockedRow {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

const SEED_ACHIEVEMENTS: AchievementRow[] = [
  { id: '00000000-0000-0000-0000-000000000201', key: 'spin_10', category: 'spin', target: 10, icon_url: null },
  { id: '00000000-0000-0000-0000-000000000202', key: 'spin_50', category: 'spin', target: 50, icon_url: null },
  { id: '00000000-0000-0000-0000-000000000203', key: 'shop_purchase_1', category: 'shop_purchase', target: 1, icon_url: null },
  { id: '00000000-0000-0000-0000-000000000204', key: 'coins_total_100', category: 'coins_total', target: 100, icon_url: null },
];

function seedAsset(id: string, name: string, category: AssetCategory, price_coins: number, asset_url: string): Asset {
  return { id, name, category, price_coins, asset_url };
}

const SEED_ASSETS: Asset[] = [
  seedAsset('00000000-0000-0000-0000-000000000101', 'Bruh', 'sound', 10, '/resources/sounds/bruh.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000102', 'Cleveland', 'companion', 40, '/resources/companions/cleveland.png'),
  seedAsset('00000000-0000-0000-0000-000000000103', 'Dry Fart', 'sound', 20, '/resources/sounds/dry-fart.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000104', 'Felix', 'companion', 150, '/resources/companions/felix.png'),
  seedAsset('00000000-0000-0000-0000-000000000105', 'Giggity', 'sound', 15, '/resources/sounds/giggity.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000106', 'Joe', 'companion', 45, '/resources/companions/joe.png'),
  seedAsset('00000000-0000-0000-0000-000000000107', 'Meg', 'companion', 40, '/resources/companions/meg.png'),
  seedAsset('00000000-0000-0000-0000-000000000108', 'Michael Jackson', 'sound', 50, '/resources/sounds/michael-jackson-hee-hee.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000109', 'Neee', 'sound', 25, '/resources/sounds/neee.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000110', 'Perfect Fart', 'sound', 25, '/resources/sounds/perfect-fart.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000111', 'Peter', 'companion', 60, '/resources/companions/peter.png'),
  seedAsset('00000000-0000-0000-0000-000000000112', 'Peter Laugh', 'sound', 0, '/resources/sounds/peter-griffin-laugh.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000113', 'Punch', 'sound', 15, '/resources/sounds/punch.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000114', 'Quagmire', 'companion', 0, '/resources/companions/quagmire.png'),
  seedAsset('00000000-0000-0000-0000-000000000115', 'Rizz', 'sound', 20, '/resources/sounds/rizz.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000116', 'Stewie', 'companion', 50, '/resources/companions/stewie.png'),
  seedAsset('00000000-0000-0000-0000-000000000117', 'Super Mario Bros', 'sound', 20, '/resources/sounds/super-mario-bros.mp3'),
  seedAsset('00000000-0000-0000-0000-000000000118', 'Whip', 'sound', 10, '/resources/sounds/whip.mp3'),
];

export const store = {
  profiles: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      suffix: 0,
      email: 'admin@admin.de',
      date_of_birth: null,
      password: 'admin',
      coins: 0,
    },
  ] as Profile[],
  spin_tokens: [] as SpinToken[],
  saved_wheels: [] as SavedLink[],
  rooms: [] as Room[],
  asset: [...SEED_ASSETS],
  asset_ownership: [] as AssetOwnership[],
  asset_selection: [] as AssetSelection[],
  achievement: [...SEED_ACHIEVEMENTS],
  user_achievement_progress: [] as UserAchievementProgressRow[],
  user_achievement_unlocked: [] as UserAchievementUnlockedRow[],
};

export function newId(): string {
  return randomUUID();
}

export function findProfile(id: string) {
  return store.profiles.find(p => p.id === id);
}

export function findProfileByEmail(email: string) {
  return store.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
}

export function findProfileByUsername(username: string) {
  return store.profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
}

export function nextFreeSuffix(username: string): number {
  const takenSuffixes = store.profiles
    .filter(p => p.username.toLowerCase() === username.toLowerCase())
    .map(p => p.suffix);
  return takenSuffixes.length === 0 ? 0 : Math.max(...takenSuffixes) + 1;
}

export function createProfile(data: Omit<Profile, 'coins'>): Profile {
  const profile: Profile = { ...data, coins: 0 };
  store.profiles.push(profile);
  return profile;
}

export function addCoinsToUser(userId: string, amount: number): void {
  const profile = findProfile(userId);
  if (profile) profile.coins += amount;
}

export function getSavedLinks(userId: string): SavedLink[] {
  return store.saved_wheels
    .filter(l => l.user_id === userId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, 12);
}

export function createSavedLink(data: Omit<SavedLink, 'id' | 'created_at'>): SavedLink {
  const link: SavedLink = {
    id: randomUUID(),
    ...data,
    created_at: new Date().toISOString(),
  };
  store.saved_wheels.push(link);
  return link;
}

export function deleteSavedLink(id: string): void {
  const idx = store.saved_wheels.findIndex(l => l.id === id);
  if (idx >= 0) store.saved_wheels.splice(idx, 1);
}
