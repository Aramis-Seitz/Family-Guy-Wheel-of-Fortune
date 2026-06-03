import { supabaseClient } from "../lib/supabase-client";

export type ProfileSummary = {
    username: string;
    coins: number;
};

type RawProfile = {
    id: string;
    username?: string | null;
    coins?: number | null;
};

export async function getProfileByUserId(userId: string): Promise<ProfileSummary | null> {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("username, coins")
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
