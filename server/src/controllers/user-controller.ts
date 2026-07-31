import { z } from "zod";
import { ensureDefaultAssets, getUserCoins, getUserProfile, registerUser, addUserCoins, subtractUserCoins } from "../services/user-service";
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
    await registerUser(req.userId!, username, email, dateOfBirth);
    res.status(201).json({ ok: true });
});

export const handleGetUserCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const coins = await getUserCoins(req.params!.userId!);
    res.status(200).json(CoinsResponseSchema.parse({ coins }));
});

const PatchCoinsRequestSchema = z.union([
    z.object({ add: z.number() }).strict(),
    z.object({ subtract: z.number() }).strict(),
]);

export const handlePatchUserCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = PatchCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Provide either { add } or { subtract }" });
        return;
    }

    const userId = req.params!.userId!;
    const coins = "add" in parsedBody.data
        ? await addUserCoins(userId, parsedBody.data.add)
        : await subtractUserCoins(userId, parsedBody.data.subtract);
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
