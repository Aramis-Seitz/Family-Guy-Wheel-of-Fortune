import {
    getAll,
    getProgress,
    getUnlocked,
    upsertProgress,
    insertUnlocked,
} from "../repositories/achievement-repository";
import type { Achievement, AchievementCategory, AchievementWithProgress, UnlockedAchievement } from "shared";

export interface ProgressResult {
    unlocked: UnlockedAchievement[];
    progressed: AchievementWithProgress[];
}

export async function incrementProgress(
    userId: string,
    category: AchievementCategory,
    amount: number
): Promise<ProgressResult> {
    const achievements = (await getAll()).filter((achievement) => achievement.category === category);
    if (achievements.length === 0) return { unlocked: [], progressed: [] };

    const [progressRows, unlockedRows] = await Promise.all([
        getProgress(userId),
        getUnlocked(userId),
    ]);

    const alreadyUnlockedIds = new Set(unlockedRows.map((row) => row.achievement_id));
    const unlocked: UnlockedAchievement[] = [];
    const progressed: AchievementWithProgress[] = [];

    for (const achievement of achievements) {
        if (alreadyUnlockedIds.has(achievement.id)) continue;

        const currentProgress = progressRows.find((row) => row.achievement_id === achievement.id)?.progress ?? 0;
        const updatedProgress = Math.min(currentProgress + amount, achievement.target);

        await upsertProgress(userId, achievement.id, updatedProgress);

        if (updatedProgress >= achievement.target) {
            await insertUnlocked(userId, achievement.id);
            unlocked.push({ ...achievement, unlocked_at: new Date().toISOString() });
        } else {
            progressed.push({ ...achievement, progress: updatedProgress, unlocked: false });
        }
    }

    return { unlocked, progressed };
}

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
