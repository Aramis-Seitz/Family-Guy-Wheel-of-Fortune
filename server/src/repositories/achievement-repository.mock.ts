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
