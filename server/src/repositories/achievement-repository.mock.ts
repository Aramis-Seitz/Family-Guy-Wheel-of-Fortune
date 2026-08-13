import { store } from "../mock/store";
import type * as Real from "./achievement-repository.real";
import type { Achievement, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export const getAll: typeof Real.getAll = async () => {
    return store.achievement as Achievement[];
};

export const getProgress: typeof Real.getProgress = async (userId) => {
    return store.user_achievement_progress.filter((p) => p.user_id === userId) as UserAchievementProgress[];
};

export const getUnlocked: typeof Real.getUnlocked = async (userId) => {
    return store.user_achievement_unlocked.filter((u) => u.user_id === userId) as UserAchievementUnlocked[];
};

export const upsertProgress: typeof Real.upsertProgress = async (userId, achievementId, progress) => {
    const existing = store.user_achievement_progress.find(
        (p) => p.user_id === userId && p.achievement_id === achievementId
    );

    if (existing) {
        existing.progress = progress;
        existing.updated_at = new Date().toISOString();
    } else {
        store.user_achievement_progress.push({
            user_id: userId,
            achievement_id: achievementId,
            progress,
            updated_at: new Date().toISOString(),
        });
    }
};

export const insertUnlocked: typeof Real.insertUnlocked = async (userId, achievementId) => {
    const alreadyUnlocked = store.user_achievement_unlocked.some(
        (u) => u.user_id === userId && u.achievement_id === achievementId
    );
    if (alreadyUnlocked) return;

    store.user_achievement_unlocked.push({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
    });
};
