import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import { handleGenerateSpin, handleAwardCoins } from "../controllers/spin-controller";

export const spinRoutes = Router();

spinRoutes.use(requireAuth);

spinRoutes.post("/random", handleGenerateSpin);
spinRoutes.post("/award-coins", handleAwardCoins);
