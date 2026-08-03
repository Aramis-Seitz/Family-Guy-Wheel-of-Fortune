import { Router } from "express";
import { requireSelf } from "../middleware/require-self";
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

roomRoutes.param("userId", requireSelf);

roomRoutes.post("/", handleCreateRoom);
roomRoutes.patch("/:roomKey", handleResetRoom);
roomRoutes.patch("/:roomKey/multiplier", handleSetMultiplier);
roomRoutes.post("/:roomKey/players", handleJoinRoom);
roomRoutes.delete("/:roomKey/players/:userId", handleLeaveRoom);
roomRoutes.post("/:roomKey/spins", handleSpinRoom);
roomRoutes.patch("/:roomKey/names-in-wheel-list", handleUpdateNames);
