import { randomUUID } from "crypto";

// In-memory Ersatz für die Supabase-Tabellen. Bildet die Tabellen aus
// supabase/migrations nach (profiles, rooms, spin_tokens, saved_wheels,
// asset, asset_ownership, asset_selection) plus ein separates authUsers
// als Ersatz für auth.users, weil das Projekt profiles bewusst getrennt
// von der Auth-Identität hält (siehe registerUser in user-service.ts).

export type Player = { id: string; username: string };

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    password: string;
    date_of_birth: string | null;
}

export interface Profile {
    id: string;
    username: string;
    email: string;
    date_of_birth: string | null;
    coins: number;
}

export interface Room {
    id: string;
    room_key: string;
    host_id: string;
    players: Player[];
    names_in_wheel: string[];
    last_spin: number | null;
    spun_at: string | null;
    multiplier: number;
    spin_direction: string | null;
    wheel_reset_at: string | null;
    winner_modal_close_at: string | null;
    created_at: string;
}

export interface SpinToken {
    token: string;
    user_id: string;
    used: boolean;
    created_at: string;
}

export interface SavedWheel {
    id: string;
    user_id: string;
    wheel_title: string;
    url: string;
    created_at: string;
}

export type AssetCategory = "sound" | "companion";

export interface Asset {
    id: string;
    name: string;
    category: AssetCategory;
    price_coins: number;
    asset_url: string;
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

export interface ChatMessage {
    seq: number;
    event: string;
    payload: unknown;
}

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";

function seedAsset(id: string, name: string, category: AssetCategory, price_coins: number, asset_url: string): Asset {
    return { id, name, category, price_coins, asset_url };
}

// Gleiche Namen/Preise/Pfade wie supabase/migrations/06_shop_seed_assets.sql
// (Pfad bereits im neuen /resources-Format aus Migration 17).
const SEED_ASSETS: Asset[] = [
    seedAsset("00000000-0000-0000-0000-000000000101", "Bruh", "sound", 10, "/resources/sounds/bruh.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000102", "Cleveland", "companion", 40, "/resources/companions/cleveland.png"),
    seedAsset("00000000-0000-0000-0000-000000000103", "Dry Fart", "sound", 20, "/resources/sounds/dry-fart.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000104", "Felix", "companion", 150, "/resources/companions/felix.png"),
    seedAsset("00000000-0000-0000-0000-000000000105", "Giggity", "sound", 15, "/resources/sounds/giggity.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000106", "Joe", "companion", 45, "/resources/companions/joe.png"),
    seedAsset("00000000-0000-0000-0000-000000000107", "Meg", "companion", 40, "/resources/companions/meg.png"),
    seedAsset("00000000-0000-0000-0000-000000000108", "Michael Jackson", "sound", 50, "/resources/sounds/michael-jackson-hee-hee.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000109", "Neee", "sound", 25, "/resources/sounds/neee.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000110", "Perfect Fart", "sound", 25, "/resources/sounds/perfect-fart.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000111", "Peter", "companion", 60, "/resources/companions/peter.png"),
    seedAsset("00000000-0000-0000-0000-000000000112", "Peter Laugh", "sound", 0, "/resources/sounds/peter-griffin-laugh.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000113", "Punch", "sound", 15, "/resources/sounds/punch.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000114", "Quagmire", "companion", 0, "/resources/companions/quagmire.png"),
    seedAsset("00000000-0000-0000-0000-000000000115", "Rizz", "sound", 20, "/resources/sounds/rizz.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000116", "Stewie", "companion", 50, "/resources/companions/stewie.png"),
    seedAsset("00000000-0000-0000-0000-000000000117", "Super Mario Bros", "sound", 20, "/resources/sounds/super-mario-bros.mp3"),
    seedAsset("00000000-0000-0000-0000-000000000118", "Whip", "sound", 10, "/resources/sounds/whip.mp3"),
];

export const store = {
    authUsers: [
        { id: ADMIN_ID, email: "admin@admin.de", username: "admin", password: "admin", date_of_birth: null },
    ] as AuthUser[],

    // profiles.coins hat in Supabase "default 1" (siehe Migration 01), aber
    // für den Admin-Testaccount ist ein größeres Startkapital praktischer,
    // um Shop-Käufe sofort ausprobieren zu können.
    profiles: [
        { id: ADMIN_ID, username: "admin", email: "admin@admin.de", date_of_birth: null, coins: 100 },
    ] as Profile[],

    rooms: [] as Room[],
    spin_tokens: [] as SpinToken[],
    saved_wheels: [] as SavedWheel[],

    asset: [...SEED_ASSETS],
    asset_ownership: [] as AssetOwnership[],
    asset_selection: [] as AssetSelection[],

    chat: new Map<string, ChatMessage[]>(),
};

let chatSeq = 0;

export function appendChatMessage(roomKey: string, event: string, payload: unknown): ChatMessage {
    const msg: ChatMessage = { seq: ++chatSeq, event, payload };
    const list = store.chat.get(roomKey) ?? [];
    list.push(msg);
    if (list.length > 200) list.shift();
    store.chat.set(roomKey, list);
    return msg;
}

export function getChatMessagesSince(roomKey: string, sinceSeq: number): ChatMessage[] {
    return (store.chat.get(roomKey) ?? []).filter((m) => m.seq > sinceSeq);
}

export function newId(): string {
    return randomUUID();
}
