import { z } from "zod";
import { ensureDefaultAssets, getUserCoins, getUserProfile, registerUser } from "../services/user-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CoinsResponseSchema,
    ProfileResponseSchema,
} from "shared";

export const handleEnsureDefaultAssets = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    await ensureDefaultAssets(req.params!.userId!);
    res.status(200).json({ ok: true });
});

const RegisterRequestSchema = z.object({
    username: z.string().min(1),
    email: z.string().min(1),
    dateOfBirth: z.string().min(1),
});

export const handleRegisterUser = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = RegisterRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "username, email und dateOfBirth sind erforderlich" });
        return;
    }

    const { username, email, dateOfBirth } = parsedBody.data;
    // Gleiche Usernames sind erlaubt, solange der Suffix unterschiedlich ist.
    // Der Suffix wird beim Insert automatisch vergeben.
    await registerUser(req.userId!, username, email, dateOfBirth);
    res.status(201).json({ ok: true });
});

export const handleGetUserCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const coins = await getUserCoins(req.params!.userId!);
    res.status(200).json(CoinsResponseSchema.parse({ coins }));
});

export const handleUserProfile = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const profile = await getUserProfile(req.params!.userId!);
    if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
    }

    res.status(200).json(ProfileResponseSchema.parse({ profile }));
});
