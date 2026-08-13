import type { Achievement, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export interface AchievementRepository {
    getAll(): Promise<Achievement[]>;
    getProgress(userId: string): Promise<UserAchievementProgress[]>;
    getUnlocked(userId: string): Promise<UserAchievementUnlocked[]>;
    upsertProgress(userId: string, achievementId: string, progress: number): Promise<void>;
    insertUnlocked(userId: string, achievementId: string): Promise<void>;
}
