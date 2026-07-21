import { z } from "zod";
import { generateSpin, awardCoins } from "../services/spin-service";
import { asyncHandler, sendCodedError } from "./response";
import { ERROR_CODES } from "../lib/error-codes";
import type { HttpRequest, HttpResponse } from "./response";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";

export const handleGenerateSpin = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const result = await generateSpin(req.userId!);
    res.status(200).json(SpinRandomResponseSchema.parse(result));
});

const AwardCoinsRequestSchema = z.object({
    spinToken: z.string().min(1),
    winnerName: z.string().min(1),
});

export const handleAwardCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = AwardCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        sendCodedError(res, 400, "Missing spinToken or winnerName", ERROR_CODES.VALIDATION, { fields: ["spinToken", "winnerName"] });
        return;
    }

    const result = await awardCoins(req.userId!, parsedBody.data.spinToken, parsedBody.data.winnerName);
    res.status(200).json(AwardCoinsResponseSchema.parse(result));
});
