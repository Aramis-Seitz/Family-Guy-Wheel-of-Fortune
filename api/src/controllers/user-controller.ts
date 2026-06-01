import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getUserCoins, getUserProfile, setUserCoins, subtractUserCoins } from "../services/user-service";
import { sendMethodNotAllowed, sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

type CoinsRequestBody = {
    coins?: number;
};

type SubtractCoinsRequestBody = {
    amount?: number;
};

export async function handleUserCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "GET" && req.method !== "POST") {
        sendMethodNotAllowed(res, "GET, POST");
        return;
    }

    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (req.method === "GET") {
            const coins = await getUserCoins(userId);
            res.status(200).json({ coins });
            return;
        }

        const body = (req.body ?? {}) as CoinsRequestBody;
        const coins = await setUserCoins(userId, Number(body.coins));
        res.status(200).json({ coins });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleUserProfile(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res, "GET");
        return;
    }

    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const profile = await getUserProfile(userId);
        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        res.status(200).json({ profile });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleSubtractCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "POST") {
        sendMethodNotAllowed(res, "POST");
        return;
    }

    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = (req.body ?? {}) as SubtractCoinsRequestBody;
        const coins = await subtractUserCoins(userId, Number(body.amount));

        res.status(200).json({ coins });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
