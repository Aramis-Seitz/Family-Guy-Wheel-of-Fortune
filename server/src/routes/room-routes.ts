import { Router } from "express";
import {
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleSpinRoom,
    handleResetRoom,
    handleSetMultiplier,
    handleUpdateNames
} from "../controllers/room-controller";

export const roomRoutes = Router();

roomRoutes.post("/create", handleCreateRoom);
roomRoutes.post("/join", handleJoinRoom);
roomRoutes.post("/leave", handleLeaveRoom);
roomRoutes.post("/spin", handleSpinRoom);
roomRoutes.post("/reset", handleResetRoom);
roomRoutes.post("/multiplier", handleSetMultiplier);
roomRoutes.post("/wheel-items", handleUpdateNames);