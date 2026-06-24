import { Router } from "express";
import { handleCreateRoom, handleJoinRoom, handleCloseRoom, handleSpinRoom, handleResetRoom, handleSetMultiplier } from "../controllers/room-controller";

export const roomRoutes = Router();

roomRoutes.post("/create", handleCreateRoom);
roomRoutes.post("/join", handleJoinRoom);
roomRoutes.post("/close", handleCloseRoom);
roomRoutes.post("/spin", handleSpinRoom);
roomRoutes.post("/reset", handleResetRoom);
roomRoutes.post("/multiplier", handleSetMultiplier);
