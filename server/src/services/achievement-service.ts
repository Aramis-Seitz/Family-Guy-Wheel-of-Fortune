import {
    getAll,
    getProgress,
    getUnlocked,
    getUnclaimedAchievementsByCategory,
    upsertProgress,
    insertUnlocked,
} from "../repositories/achievement-repository";
import type { Achievement, AchievementCategory, AchievementWithProgress } from "shared";

export async function getAchievementsWithProgress(userId: string): Promise<AchievementWithProgress[]> {
    const [achievements, progressRows, unlockedRows] = await Promise.all([
        getAll(),
        getProgress(userId),
        getUnlocked(userId),
    ]);

    const unlockedIds = new Set(unlockedRows.map((row) => row.achievement_id));

    return achievements.map((achievement: Achievement) => ({
        ...achievement,
        progress: progressRows.find((row) => row.achievement_id === achievement.id)?.progress ?? 0,
        unlocked: unlockedIds.has(achievement.id),
    }));
}

export async function incrementAchievementProgress(
    userId: string,
    category: AchievementCategory,
    amount: number,
): Promise<void> {
    const [unclaimedAchievements, progressRows] = await Promise.all([
        getUnclaimedAchievementsByCategory(userId, category),
        getProgress(userId),
    ]);

    await Promise.all(
        unclaimedAchievements.map(async (achievement) => {
            const currentProgress = progressRows.find((row) => row.achievement_id === achievement.id)?.progress ?? 0;
            const newProgress = Math.min(currentProgress + amount, achievement.target);

            await upsertProgress(userId, achievement.id, newProgress);

            if (newProgress >= achievement.target) {
                await insertUnlocked(userId, achievement.id);
            }
        }),
    );
}
