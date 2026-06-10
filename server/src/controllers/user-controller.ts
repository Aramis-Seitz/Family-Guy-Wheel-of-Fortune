import { resolveUserIdFromHeaders } from "../services/auth-service";
import { ensureDefaultAssets, getUserCoins, getUserProfile, registerUser, setUserCoins, subtractUserCoins } from "../services/user-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

type RegisterRequestBody = {
    username?: string;
    email?: string;
    dateOfBirth?: string;
};

type CoinsRequestBody = {
    coins?: number;
};

type SubtractCoinsRequestBody = {
    amount?: number;
};

export async function handleEnsureDefaultAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        await ensureDefaultAssets(userId);
        res.status(200).json({ success: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleRegisterUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = (req.body ?? {}) as RegisterRequestBody;
        const { username, email, dateOfBirth } = body;

        if (!username || !email || !dateOfBirth) {
            res.status(400).json({ error: "username, email und dateOfBirth sind erforderlich" });
            return;
        }

        await registerUser(userId, username, email, dateOfBirth);
        res.status(201).json({ success: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleGetUserCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const coins = await getUserCoins(userId);
        res.status(200).json({ coins });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

export async function handleSetUserCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
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
