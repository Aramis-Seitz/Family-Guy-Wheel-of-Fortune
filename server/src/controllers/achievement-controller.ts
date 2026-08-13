import { getAchievementsWithProgress } from "../services/achievement-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { AchievementsResponseSchema } from "shared";

export const handleGetAchievements = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const achievements = await getAchievementsWithProgress(req.userId!);
    res.status(200).json(AchievementsResponseSchema.parse({ achievements }));
});
