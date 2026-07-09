import { z } from "zod";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import { ensureDefaultAssets, getUserCoins, getUserProfile, registerUser, setUserCoins, subtractUserCoins } from "../services/user-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CoinsResponseSchema,
    ProfileResponseSchema,
} from "shared";

export async function handleEnsureDefaultAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        await ensureDefaultAssets(userId);
        res.status(200).json({ ok: true });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const RegisterRequestSchema = z.object({
    username: z.string().min(1),
    email: z.string().min(1),
    dateOfBirth: z.string().min(1),
});

export async function handleRegisterUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = RegisterRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "username, email und dateOfBirth sind erforderlich" });
            return;
        }

        const { username, email, dateOfBirth } = parsedBody.data;
        await registerUser(userId, username, email, dateOfBirth);
        res.status(201).json({ ok: true });
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
        res.status(200).json(CoinsResponseSchema.parse({ coins }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SetCoinsRequestSchema = z.object({
    coins: z.number(),
});

export async function handleSetUserCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SetCoinsRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "coins is required" });
            return;
        }

        const coins = await setUserCoins(userId, parsedBody.data.coins);
        res.status(200).json(CoinsResponseSchema.parse({ coins }));
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

        res.status(200).json(ProfileResponseSchema.parse({ profile }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const SubtractCoinsRequestSchema = z.object({
    amount: z.number(),
});

export async function handleSubtractCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = SubtractCoinsRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "amount is required" });
            return;
        }

        const coins = await subtractUserCoins(userId, parsedBody.data.amount);
        res.status(200).json(CoinsResponseSchema.parse({ coins }));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
