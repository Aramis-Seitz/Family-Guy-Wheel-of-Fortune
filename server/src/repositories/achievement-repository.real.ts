import { supabaseClient } from "../lib/supabase-client";
import type { Achievement, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export async function getAll(): Promise<Achievement[]> {
    const { data, error } = await supabaseClient
        .from("achievement")
        .select("id, key, category, target, icon_url");

    if (error) throw error;
    return (data ?? []) as Achievement[];
}

export async function getProgress(userId: string): Promise<UserAchievementProgress[]> {
    const { data, error } = await supabaseClient
        .from("user_achievement_progress")
        .select("user_id, achievement_id, progress, updated_at")
        .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []) as UserAchievementProgress[];
}

export async function getUnlocked(userId: string): Promise<UserAchievementUnlocked[]> {
    const { data, error } = await supabaseClient
        .from("user_achievement_unlocked")
        .select("user_id, achievement_id, unlocked_at")
        .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []) as UserAchievementUnlocked[];
}

export async function upsertProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    const { error } = await supabaseClient
        .from("user_achievement_progress")
        .upsert(
            { user_id: userId, achievement_id: achievementId, progress, updated_at: new Date().toISOString() },
            { onConflict: "user_id,achievement_id" }
        );

    if (error) throw error;
}

export async function insertUnlocked(userId: string, achievementId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("user_achievement_unlocked")
        .upsert(
            { user_id: userId, achievement_id: achievementId },
            { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
        );

    if (error) throw error;
}
