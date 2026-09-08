import { supabaseClient } from "../lib/supabase-client";
import type { Achievement, AchievementCategory, UserAchievementProgress, UserAchievementUnlocked } from "shared";

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

export async function getUnclaimedAchievementsByCategory(
    userId: string,
    category: AchievementCategory,
): Promise<Achievement[]> {
    const unlocked = await getUnlocked(userId);
    const unlockedAchievementIds = unlocked.map((row) => row.achievement_id);

    let query = supabaseClient
        .from("achievement")
        .select("id, key, category, target, icon_url")
        .eq("category", category);

    if (unlockedAchievementIds.length > 0) {
        query = query.not("id", "in", `(${unlockedAchievementIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Achievement[];
}

export async function upsertProgress(userId: string, achievementId: string, newProgress: number): Promise<void> {
    const { error } = await supabaseClient
        .from("user_achievement_progress")
        .upsert(
            {
                user_id: userId,
                achievement_id: achievementId,
                progress: newProgress,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,achievement_id" },
        );

    if (error) throw error;
}

export async function insertUnlocked(userId: string, achievementId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("user_achievement_unlocked")
        .upsert(
            {
                user_id: userId,
                achievement_id: achievementId,
                unlocked_at: new Date().toISOString(),
            },
            { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
        );

    if (error) throw error;
}
