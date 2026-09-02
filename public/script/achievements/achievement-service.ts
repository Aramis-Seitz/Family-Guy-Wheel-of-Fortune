import { getJson, getCurrentUserId } from "../api/api-helpers";
import { supabaseClient } from "../shared/supabase-client";
import { AchievementsResponseSchema } from "shared";
import type { AchievementWithProgress } from "shared";
import type { RealtimeChannel } from "@supabase/supabase-js";

export async function fetchAchievements(): Promise<AchievementWithProgress[]> {
    const rawBody = await getJson("/api/achievements", {
        errorFallbackKey: "api.achievements.loadFailed"
    });
    const body = AchievementsResponseSchema.parse(rawBody);
    return body.achievements;
}

let activeChannel: RealtimeChannel | null = null;

type UnlockedRow = { achievement_id: string };

export async function subscribeToAchievementUnlocks(onUnlock: (achievementId: string) => void): Promise<void> {
    const userId = await getCurrentUserId();
    unsubscribeFromAchievementUnlocks();

    activeChannel = supabaseClient
        .channel(`achievements:${userId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "user_achievement_unlocked",
                filter: `user_id=eq.${userId}`,
            },
            (payload: { new: UnlockedRow }) => {
                onUnlock(payload.new.achievement_id);
            },
        )
        .subscribe();
}

export function unsubscribeFromAchievementUnlocks(): void {
    if (activeChannel) {
        void supabaseClient.removeChannel(activeChannel);
        activeChannel = null;
    }
}
