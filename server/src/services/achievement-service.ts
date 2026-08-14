import { getAll, getProgress, getUnlocked } from "../repositories/achievement-repository";
import type { Achievement, AchievementWithProgress } from "shared";

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
