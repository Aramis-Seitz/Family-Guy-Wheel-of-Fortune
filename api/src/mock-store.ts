import { randomUUID } from 'crypto';

export interface Profile {
  id: string;
  username: string;
  email: string;
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
  link_name: string;
  url: string;
  created_at: string;
}

export const store = {
  profiles: [] as Profile[],
  spin_tokens: [] as SpinToken[],
  saved_links: [] as SavedLink[],
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
  return store.saved_links
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
  store.saved_links.push(link);
  return link;
}

export function deleteSavedLink(id: string): void {
  const idx = store.saved_links.findIndex(l => l.id === id);
  if (idx >= 0) store.saved_links.splice(idx, 1);
}
