import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import {
    handleEnsureDefaultAssets,
    handleRegisterUser,
    handleSubtractCoins,
    handleGetUserCoins,
    handleSetUserCoins,
    handleUserProfile
} from "../controllers/user-controller";

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.post("/register", handleRegisterUser);
userRoutes.post("/ensure-defaults", handleEnsureDefaultAssets);
userRoutes.get("/coins", handleGetUserCoins);
userRoutes.post("/coins", handleSetUserCoins);
userRoutes.get("/profile", handleUserProfile);
userRoutes.post("/subtract-coins", handleSubtractCoins);
