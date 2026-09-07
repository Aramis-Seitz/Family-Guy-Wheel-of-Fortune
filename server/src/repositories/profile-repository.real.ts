import { supabaseClient } from "../lib/supabase-client";
import type { Profile } from "./profile-repository.shared";
import { parseDisplayName } from "../lib/display-name";

type RawProfile = {
    id: string;
    username?: string | null;
    suffix?: number | null;
    coins?: number | null;
};

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("username, coins, suffix")
        .eq("id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
    }

    const profile = data as RawProfile | null;
    if (!profile || typeof profile.username !== "string") return null;

    return {
        username: profile.username,
        suffix: typeof profile.suffix === "number" ? profile.suffix : 0,
        coins: typeof profile.coins === "number" ? profile.coins : 0
    };
}

export async function getCoinsByUserId(userId: string): Promise<number> {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("coins")
        .eq("id", userId)
        .single();

    if (error) throw error;
    const profile = data as { coins?: number | null } | null;
    return typeof profile?.coins === "number" ? profile.coins : 0;
}

export async function updateCoinsByUserId(userId: string, coins: number): Promise<void> {
    const { error } = await supabaseClient
        .from("profiles")
        .update({ coins })
        .eq("id", userId);

    if (error) throw error;
}

export async function getUserIdByUsername(displayName: string): Promise<string | null> {
    const parsed = parseDisplayName(displayName);
    if (!parsed) return null;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id")
        .ilike("username", parsed.username)
        .eq("suffix", parsed.suffix)
        .single();

    if (error || !data) return null;
    return (data as { id: string }).id;
}

async function getNextFreeSuffix(username: string): Promise<number> {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("suffix")
        .ilike("username", username)
        .order("suffix", { ascending: false })
        .limit(1);

    if (error) throw error;
    const highestTakenSuffix = data[0]?.suffix ?? -1;
    return highestTakenSuffix + 1;
}

export async function insertProfile(userId: string, username: string, email: string, dateOfBirth: string): Promise<void> {
    const suffix = await getNextFreeSuffix(username);
    const { error } = await supabaseClient
        .from("profiles")
        .insert({ id: userId, username, suffix, email, date_of_birth: dateOfBirth });

    if (error) throw error;
}
