import { store } from "../mock/store";
import type * as Real from "./achievement-repository.real";
import type { Achievement, AchievementCategory, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export const getAll: typeof Real.getAll = async () => {
    return store.achievement as Achievement[];
};

export const getProgress: typeof Real.getProgress = async (userId) => {
    return store.user_achievement_progress.filter((p) => p.user_id === userId) as UserAchievementProgress[];
};

export const getUnlocked: typeof Real.getUnlocked = async (userId) => {
    return store.user_achievement_unlocked.filter((u) => u.user_id === userId) as UserAchievementUnlocked[];
};

export const getUnclaimedAchievementsByCategory: typeof Real.getUnclaimedAchievementsByCategory = async (userId, category: AchievementCategory) => {
    const unlockedAchievementIds = new Set(
        store.user_achievement_unlocked.filter((u) => u.user_id === userId).map((u) => u.achievement_id),
    );

    return store.achievement.filter(
        (a) => a.category === category && !unlockedAchievementIds.has(a.id),
    ) as Achievement[];
};

export const upsertProgress: typeof Real.upsertProgress = async (userId, achievementId, newProgress) => {
    const updatedAt = new Date().toISOString();
    const existingProgress = store.user_achievement_progress.find(
        (p) => p.user_id === userId && p.achievement_id === achievementId,
    );

    if (existingProgress) {
        existingProgress.progress = newProgress;
        existingProgress.updated_at = updatedAt;
    } else {
        store.user_achievement_progress.push({
            user_id: userId,
            achievement_id: achievementId,
            progress: newProgress,
            updated_at: updatedAt,
        });
    }
};

export const insertUnlocked: typeof Real.insertUnlocked = async (userId, achievementId) => {
    const alreadyUnlocked = store.user_achievement_unlocked.some(
        (u) => u.user_id === userId && u.achievement_id === achievementId,
    );

    if (!alreadyUnlocked) {
        store.user_achievement_unlocked.push({
            user_id: userId,
            achievement_id: achievementId,
            unlocked_at: new Date().toISOString(),
        });
    }
};
