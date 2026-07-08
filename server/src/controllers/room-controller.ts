import { resolveUserIdFromHeaders } from "../services/auth-service";
import { createRoom, joinRoom, leaveRoom, closeRoom, spinRoom, setRoomNames, resetRoom, setMultiplier } from "../services/room-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";

export async function handleCreateRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await createRoom(userId);
        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

type RoomKeyBody = {
    roomKey?: string;
    direction?: string;
};

export async function handleJoinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        const result = await joinRoom(userId, roomKey);
        res.status(200).json(result);
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

        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await leaveRoom(userId, roomKey);
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

        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await closeRoom(userId, roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleSpinRoom(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { roomKey, direction } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }
        if (direction !== "left" && direction !== "right") {
            res.status(400).json({ error: "Missing or invalid direction" });
            return;
        }

        const result = await spinRoom(userId, roomKey, direction);
        res.status(200).json(result);
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

        const { roomKey } = (req.body ?? {}) as RoomKeyBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        await resetRoom(userId, roomKey);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

type SetMultiplierBody = {
    roomKey?: string;
    multiplier?: number;
};

export async function handleSetMultiplier(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { roomKey, multiplier } = (req.body ?? {}) as SetMultiplierBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        if (typeof multiplier !== "number") {
            res.status(400).json({ error: "Missing multiplier" });
            return;
        }

        await setMultiplier(userId, roomKey, multiplier);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

type SetNamesBody = {
    roomKey?: string;
    names?: string[];
};

export async function handleUpdateNames(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { roomKey, names } = (req.body ?? {}) as SetNamesBody;
        if (!roomKey) {
            res.status(400).json({ error: "Missing roomKey" });
            return;
        }

        if (!Array.isArray(names)) {
            res.status(400).json({ error: "Missing names" });
            return;
        }

        await setRoomNames(userId, roomKey, names);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}