import type { Achievement, AchievementCategory, UserAchievementProgress, UserAchievementUnlocked } from "shared";

export interface AchievementRepository {
    getAll(): Promise<Achievement[]>;
    getProgress(userId: string): Promise<UserAchievementProgress[]>;
    getUnlocked(userId: string): Promise<UserAchievementUnlocked[]>;

    getUnclaimedAchievementsByCategory(userId: string, category: AchievementCategory): Promise<Achievement[]>;

    upsertProgress(userId: string, achievementId: string, newProgress: number): Promise<void>;

    insertUnlocked(userId: string, achievementId: string): Promise<void>;
}
