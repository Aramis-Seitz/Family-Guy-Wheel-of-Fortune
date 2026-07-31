import { Router } from "express";
import { handleGenerateSpin, handleAwardCoins } from "../controllers/spin-controller";

export const spinsRoutes = Router();

spinsRoutes.post("/", handleGenerateSpin);
spinsRoutes.post("/:spinToken/award", handleAwardCoins);
