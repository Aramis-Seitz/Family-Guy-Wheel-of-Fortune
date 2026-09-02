import { Router } from "express";
import { handleGetAchievements } from "../controllers/achievement-controller";

export const achievementsRoutes = Router();

achievementsRoutes.get("/", handleGetAchievements);
