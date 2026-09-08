import { Router } from "express";
import { requireSelf } from "../middleware/require-self";
import {
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleSpinRoom,
    handleResetRoom,
    handleSetMultiplier,
    handleAddWheelName,
    handleRemoveWheelEntry,
    handleSyncPlayersInWheel
} from "../controllers/room-controller";

export const roomRoutes = Router();

roomRoutes.param("userId", requireSelf);

roomRoutes.post("/", handleCreateRoom);
roomRoutes.patch("/:roomKey", handleResetRoom);
roomRoutes.patch("/:roomKey/multiplier", handleSetMultiplier);
roomRoutes.post("/:roomKey/players", handleJoinRoom);
roomRoutes.delete("/:roomKey/players/:userId", handleLeaveRoom);
roomRoutes.post("/:roomKey/spins", handleSpinRoom);
roomRoutes.post("/:roomKey/names-in-wheel-list", handleAddWheelName);
roomRoutes.delete("/:roomKey/names-in-wheel-list/:index", handleRemoveWheelEntry);
roomRoutes.patch("/:roomKey/players-in-wheel-list", handleSyncPlayersInWheel);
