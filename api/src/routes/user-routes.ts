import { Router } from "express";
import { handleSubtractCoins, handleUserCoins, handleUserProfile } from "../controllers/user-controller";

export const userRoutes = Router();

userRoutes.get("/coins", handleUserCoins);
userRoutes.post("/coins", handleUserCoins);
userRoutes.get("/profile", handleUserProfile);
userRoutes.post("/subtract-coins", handleSubtractCoins);
