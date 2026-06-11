import { resolveUserIdFromHeaders } from "../services/auth-service";
import { createRoom, joinRoom, closeRoom, spinRoom } from "../services/room-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

type RoomKeyBody = { roomKey?: string };

export async function handleCreateRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
        const result = await createRoom(userId);
        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleJoinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) { res.status(400).json({ error: "Missing roomKey" }); return; }
        const players = await joinRoom(userId, roomKey);
        res.status(200).json({ players });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleCloseRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) { res.status(400).json({ error: "Missing roomKey" }); return; }
        await closeRoom(userId, roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleSpinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) { res.status(400).json({ error: "Missing roomKey" }); return; }
        const result = await spinRoom(userId, roomKey);
        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
