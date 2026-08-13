import { z } from "zod";

export const AchievementCategorySchema = z.enum(["spin", "shop_purchase", "coins_total"]);
export type AchievementCategory = z.infer<typeof AchievementCategorySchema>;

export const AchievementSchema = z.object({
    id: z.string(),
    key: z.string(),
    category: AchievementCategorySchema,
    target: z.number(),
    icon_url: z.string().nullable(),
});
export type Achievement = z.infer<typeof AchievementSchema>;

export const UserAchievementProgressSchema = z.object({
    user_id: z.string(),
    achievement_id: z.string(),
    progress: z.number(),
    updated_at: z.string(),
});
export type UserAchievementProgress = z.infer<typeof UserAchievementProgressSchema>;

export const UserAchievementUnlockedSchema = z.object({
    user_id: z.string(),
    achievement_id: z.string(),
    unlocked_at: z.string(),
});
export type UserAchievementUnlocked = z.infer<typeof UserAchievementUnlockedSchema>;

export const UnlockedAchievementSchema = AchievementSchema.extend({
    unlocked_at: z.string(),
});
export type UnlockedAchievement = z.infer<typeof UnlockedAchievementSchema>;

export const AchievementWithProgressSchema = AchievementSchema.extend({
    progress: z.number(),
    unlocked: z.boolean(),
});
export type AchievementWithProgress = z.infer<typeof AchievementWithProgressSchema>;

export const AchievementsResponseSchema = z.object({
    achievements: z.array(AchievementWithProgressSchema),
});
export type AchievementsResponseBody = z.infer<typeof AchievementsResponseSchema>;
