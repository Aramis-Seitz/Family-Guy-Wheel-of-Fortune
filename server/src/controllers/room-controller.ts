import { z } from "zod";
import { createRoom, joinRoom, leaveRoom, closeRoom, spinRoom, setRoomNames, resetRoom, setMultiplier } from "../services/room-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";

export const handleCreateRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const result = await createRoom(req.userId!);
    res.status(200).json(CreateRoomResponseSchema.parse(result));
});

const RoomKeyRequestSchema = z.object({
    roomKey: z.string().min(1),
});

export const handleJoinRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey" });
        return;
    }

    const result = await joinRoom(req.userId!, parsedBody.data.roomKey);
    res.status(200).json(JoinRoomResponseSchema.parse(result));
});

export const handleLeaveRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey" });
        return;
    }

    await leaveRoom(req.userId!, parsedBody.data.roomKey);
    res.status(200).json({ ok: true });
});

export const handleCloseRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey" });
        return;
    }

    await closeRoom(req.userId!, parsedBody.data.roomKey);
    res.status(200).json({ ok: true });
});

const RoomSpinRequestSchema = z.object({
    roomKey: z.string().min(1),
    direction: z.enum(["left", "right"]),
});

export const handleSpinRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RoomSpinRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey or invalid direction" });
        return;
    }

    const result = await spinRoom(req.userId!, parsedBody.data.roomKey, parsedBody.data.direction);
    res.status(200).json(SpinRandomResponseSchema.parse(result));
});

const ResetRoomRequestSchema = z.object({
    roomKey: z.string().min(1),
    closeWinnerModal: z.boolean().optional(),
});

export const handleResetRoom = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = ResetRoomRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey" });
        return;
    }

    await resetRoom(req.userId!, parsedBody.data.roomKey, parsedBody.data.closeWinnerModal ?? false);
    res.status(200).json({ ok: true });
});

const SetMultiplierRequestSchema = z.object({
    roomKey: z.string().min(1),
    multiplier: z.number(),
});

export const handleSetMultiplier = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SetMultiplierRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey or multiplier" });
        return;
    }

    await setMultiplier(req.userId!, parsedBody.data.roomKey, parsedBody.data.multiplier);
    res.status(200).json({ ok: true });
});

const SetNamesRequestSchema = z.object({
    roomKey: z.string().min(1),
    names: z.array(z.string()),
});

export const handleUpdateNames = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SetNamesRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing roomKey or names" });
        return;
    }

    await setRoomNames(req.userId!, parsedBody.data.roomKey, parsedBody.data.names);
    res.status(200).json({ ok: true });
});
