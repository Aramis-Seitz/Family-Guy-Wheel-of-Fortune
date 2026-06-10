import { Router } from "express";
import { handleEnsureDefaultAssets, handleRegisterUser, handleSubtractCoins, handleUserCoins, handleUserProfile } from "../controllers/user-controller";

export const userRoutes = Router();

userRoutes.post("/register", handleRegisterUser);
userRoutes.post("/ensure-defaults", handleEnsureDefaultAssets);
userRoutes.get("/coins", handleUserCoins);
userRoutes.post("/coins", handleUserCoins);
userRoutes.get("/profile", handleUserProfile);
userRoutes.post("/subtract-coins", handleSubtractCoins);
