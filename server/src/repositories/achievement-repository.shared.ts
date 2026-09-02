import type { Achievement, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export interface AchievementRepository {
    getAll(): Promise<Achievement[]>;
    getProgress(userId: string): Promise<UserAchievementProgress[]>;
    getUnlocked(userId: string): Promise<UserAchievementUnlocked[]>;
}
