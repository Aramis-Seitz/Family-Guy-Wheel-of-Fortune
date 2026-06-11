import { Router } from "express";
import { handleGenerateSpin, handleAwardCoins } from "../controllers/spin-controller";

export const spinRoutes = Router();

spinRoutes.get("/random", handleGenerateSpin);
spinRoutes.post("/award-coins", handleAwardCoins);
