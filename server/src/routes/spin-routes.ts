import { Router } from "express";
import { handleAwardCoins } from "../controllers/spin-controller";

export const spinRoutes = Router();

spinRoutes.post("/award-coins", handleAwardCoins);
