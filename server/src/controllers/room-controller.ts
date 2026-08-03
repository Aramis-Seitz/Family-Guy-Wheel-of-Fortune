import { z } from "zod";
import { createRoom, joinRoom, leaveRoom, spinRoom, setRoomNames, resetRoom, setMultiplier } from "../services/room-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";

export const handleCreateRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const result = await createRoom(req.userId!);
    res.status(201).json(CreateRoomResponseSchema.parse(result));
});

export const handleJoinRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const roomKey = req.params!.roomKey!;
    const result = await joinRoom(req.userId!, roomKey);
    res.status(201).json(JoinRoomResponseSchema.parse(result));
});

export const handleLeaveRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const roomKey = req.params!.roomKey!;
    const userId = req.params!.userId!;
    await leaveRoom(userId, roomKey);
    res.status(200).json({ ok: true });
});

const RoomSpinRequestSchema = z.object({
    direction: z.enum(["left", "right"]),
});

export const handleSpinRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RoomSpinRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Invalid direction" });
        return;
    }

    const roomKey = req.params!.roomKey!;
    const result = await spinRoom(req.userId!, roomKey, parsedBody.data.direction);
    res.status(201).json(SpinRandomResponseSchema.parse(result));
});

const ResetRoomRequestSchema = z.object({
    closeWinnerModal: z.boolean().optional(),
});

export const handleResetRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = ResetRoomRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Invalid body" });
        return;
    }

    const roomKey = req.params!.roomKey!;
    await resetRoom(req.userId!, roomKey, parsedBody.data.closeWinnerModal ?? false);
    res.status(200).json({ ok: true });
});

const SetMultiplierRequestSchema = z.object({
    multiplier: z.number(),
});

export const handleSetMultiplier = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SetMultiplierRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing multiplier" });
        return;
    }

    const roomKey = req.params!.roomKey!;
    await setMultiplier(req.userId!, roomKey, parsedBody.data.multiplier);
    res.status(200).json({ ok: true });
});

const SetNamesRequestSchema = z.object({
    names: z.array(z.string()),
});

export const handleUpdateNames = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SetNamesRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing names" });
        return;
    }

    const roomKey = req.params!.roomKey!;
    await setRoomNames(req.userId!, roomKey, parsedBody.data.names);
    res.status(200).json({ ok: true });
});
