import { z } from "zod";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import { createRoom, joinRoom, leaveRoom, closeRoom, spinRoom, setRoomNames, resetRoom, setMultiplier } from "../services/room-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";

export async function handleCreateRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await createRoom(userId);
        res.status(200).json(CreateRoomResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const RoomKeyRequestSchema = z.object({
    roomKey: z.string().min(1),
});

export async function handleJoinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        const result = await joinRoom(userId, parsedBody.data.roomKey);
        res.status(200).json(JoinRoomResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleLeaveRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await leaveRoom(userId, parsedBody.data.roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleCloseRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await closeRoom(userId, parsedBody.data.roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const RoomSpinRequestSchema = z.object({
    roomKey: z.string().min(1),
    direction: z.enum(["left", "right"]),
});

export async function handleSpinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RoomSpinRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey or invalid direction" });
            return;
        }

        const result = await spinRoom(userId, parsedBody.data.roomKey, parsedBody.data.direction);
        res.status(200).json(SpinRandomResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleResetRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RoomKeyRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await resetRoom(userId, parsedBody.data.roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SetMultiplierRequestSchema = z.object({
    roomKey: z.string().min(1),
    multiplier: z.number(),
});

export async function handleSetMultiplier(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SetMultiplierRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey or multiplier" });
            return;
        }

        await setMultiplier(userId, parsedBody.data.roomKey, parsedBody.data.multiplier);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SetNamesRequestSchema = z.object({
    roomKey: z.string().min(1),
    names: z.array(z.string()),
});

export async function handleUpdateNames(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SetNamesRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing roomKey or names" });
            return;
        }

        await setRoomNames(userId, parsedBody.data.roomKey, parsedBody.data.names);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
