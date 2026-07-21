import { randomUUID } from 'crypto';

export interface Profile {
  id: string;
  username: string;
  email: string;
  date_of_birth: string | null;
  password: string;
  coins: number;
}

export interface SpinToken {
  token: string;
  user_id: string;
  used: boolean;
  created_at: string;
}

export interface SavedLink {
  id: string;
  user_id: string;
  wheel_title: string;
  url: string;
  created_at: string;
}

export interface MockAsset {
  id: string;
  name: string;
  category: 'sound' | 'companion';
  price_coins: number;
  asset_url: string;
}

export interface MockAssetOwnership {
  user_id: string;
  asset_id: string;
}

export interface MockAssetSelection extends MockAssetOwnership {
  category: MockAsset['category'];
}

export interface MockRoom {
  id: string;
  room_key: string;
  host_id: string;
  players: Array<{ id: string; username: string }>;
  names_in_wheel: string[];
  last_spin: number | null;
  spun_at: string | null;
  multiplier: number;
  spin_direction: string | null;
}

export const store = {
  profiles: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      email: 'admin@admin.de',
      date_of_birth: null,
      password: 'admin',
      coins: 0,
    },
  ] as Profile[],
  spin_tokens: [] as SpinToken[],
  saved_wheels: [] as SavedLink[],
  assets: [
    { id: 'mock-sound-bruh', name: 'Bruh', category: 'sound', price_coins: 10, asset_url: '/resources/sounds/bruh.mp3' },
    { id: 'mock-companion-brian', name: 'Brian', category: 'companion', price_coins: 50, asset_url: '/resources/companions/brian.png' },
    { id: 'mock-companion-cleveland', name: 'Cleveland', category: 'companion', price_coins: 40, asset_url: '/resources/companions/cleveland.png' },
    { id: 'mock-sound-cymbal-crash', name: 'Cymbal Crash', category: 'sound', price_coins: 10, asset_url: '/resources/sounds/cymbal-crash.mp3' },
    { id: 'mock-sound-drumroll', name: 'Drumroll', category: 'sound', price_coins: 10, asset_url: '/resources/sounds/drumroll.mp3' },
    { id: 'mock-sound-dry-fart', name: 'Dry Fart', category: 'sound', price_coins: 20, asset_url: '/resources/sounds/dry-fart.mp3' },
    { id: 'mock-companion-felix', name: 'Felix', category: 'companion', price_coins: 150, asset_url: '/resources/companions/felix.png' },
    { id: 'mock-sound-giggity', name: 'Giggity', category: 'sound', price_coins: 15, asset_url: '/resources/sounds/giggity.mp3' },
    { id: 'mock-companion-joe', name: 'Joe', category: 'companion', price_coins: 45, asset_url: '/resources/companions/joe.png' },
    { id: 'mock-companion-lois', name: 'Lois', category: 'companion', price_coins: 40, asset_url: '/resources/companions/lois.png' },
    { id: 'mock-companion-meg', name: 'Meg', category: 'companion', price_coins: 40, asset_url: '/resources/companions/meg.png' },
    { id: 'mock-sound-michael-jackson', name: 'Michael Jackson', category: 'sound', price_coins: 50, asset_url: '/resources/sounds/michael-jackson-hee-hee.mp3' },
    { id: 'mock-sound-neee', name: 'Neee', category: 'sound', price_coins: 25, asset_url: '/resources/sounds/neee.mp3' },
    { id: 'mock-sound-perfect-fart', name: 'Perfect Fart', category: 'sound', price_coins: 25, asset_url: '/resources/sounds/perfect-fart.mp3' },
    { id: 'mock-companion-peter', name: 'Peter', category: 'companion', price_coins: 60, asset_url: '/resources/companions/peter.png' },
    { id: 'mock-sound-peter-laugh', name: 'Peter Laugh', category: 'sound', price_coins: 0, asset_url: '/resources/sounds/peter-griffin-laugh.mp3' },
    { id: 'mock-sound-punch', name: 'Punch', category: 'sound', price_coins: 15, asset_url: '/resources/sounds/punch.mp3' },
    { id: 'mock-companion-quagmire', name: 'Quagmire', category: 'companion', price_coins: 0, asset_url: '/resources/companions/quagmire.png' },
    { id: 'mock-sound-rizz', name: 'Rizz', category: 'sound', price_coins: 20, asset_url: '/resources/sounds/rizz.mp3' },
    { id: 'mock-companion-stewie', name: 'Stewie', category: 'companion', price_coins: 50, asset_url: '/resources/companions/stewie.png' },
    { id: 'mock-sound-super-mario-bros', name: 'Super Mario Bros', category: 'sound', price_coins: 20, asset_url: '/resources/sounds/super-mario-bros.mp3' },
    { id: 'mock-sound-whip', name: 'Whip', category: 'sound', price_coins: 10, asset_url: '/resources/sounds/whip.mp3' },
  ] as MockAsset[],
  asset_ownership: [] as MockAssetOwnership[],
  asset_selection: [] as MockAssetSelection[],
  rooms: [] as MockRoom[],
};

export function findProfile(id: string) {
  return store.profiles.find(p => p.id === id);
}

export function findProfileByEmail(email: string) {
  return store.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
}

export function findProfileByUsername(username: string) {
  return store.profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
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

export function createSpinToken(userId: string): SpinToken {
  const token: SpinToken = {
    token: randomUUID(),
    user_id: userId,
    used: false,
    created_at: new Date().toISOString(),
  };
  store.spin_tokens.push(token);
  return token;
}

export function findValidSpinToken(token: string, userId: string) {
  return store.spin_tokens.find(t => t.token === token && t.user_id === userId && !t.used);
}

export function markTokenUsed(token: string): void {
  const t = store.spin_tokens.find(st => st.token === token);
  if (t) t.used = true;
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
