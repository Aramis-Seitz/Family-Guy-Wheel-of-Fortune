import { z } from "zod";
import { ensureDefaultAssets, getUserCoins, getUserProfile, registerUser, setUserCoins, subtractUserCoins } from "../services/user-service";
import { asyncHandler, sendCodedError } from "./response";
import { ERROR_CODES } from "../lib/error-codes";
import type { HttpRequest, HttpResponse } from "./response";
import {
    CoinsResponseSchema,
    ProfileResponseSchema,
} from "shared";

export const handleEnsureDefaultAssets = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    await ensureDefaultAssets(req.userId!);
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
        sendCodedError(res, 400, "username, email and dateOfBirth are required", ERROR_CODES.VALIDATION, { fields: ["username", "email", "dateOfBirth"] });
        return;
    }

    const { username, email, dateOfBirth } = parsedBody.data;
    await registerUser(req.userId!, username, email, dateOfBirth);
    res.status(201).json({ ok: true });
});

export const handleGetUserCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const coins = await getUserCoins(req.userId!);
    res.status(200).json(CoinsResponseSchema.parse({ coins }));
});

const SetCoinsRequestSchema = z.object({
    coins: z.number(),
});

export const handleSetUserCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SetCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        sendCodedError(res, 400, "coins is required", ERROR_CODES.VALIDATION, { field: "coins" });
        return;
    }

    const coins = await setUserCoins(req.userId!, parsedBody.data.coins);
    res.status(200).json(CoinsResponseSchema.parse({ coins }));
});

export const handleUserProfile = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const profile = await getUserProfile(req.userId!);
    if (!profile) {
        sendCodedError(res, 404, "Profile not found", ERROR_CODES.NOT_FOUND, { resource: "profile" });
        return;
    }

    res.status(200).json(ProfileResponseSchema.parse({ profile }));
});

const SubtractCoinsRequestSchema = z.object({
    amount: z.number(),
});

export const handleSubtractCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = SubtractCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        sendCodedError(res, 400, "amount is required", ERROR_CODES.VALIDATION, { field: "amount" });
        return;
    }

    const coins = await subtractUserCoins(req.userId!, parsedBody.data.amount);
    res.status(200).json(CoinsResponseSchema.parse({ coins }));
});
