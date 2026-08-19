import { z } from "zod";
import { generateSpin, awardCoins } from "../services/spin-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema, WheelItemSchema } from "shared";

export const handleGenerateSpin = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const result = await generateSpin(req.userId!);
    res.status(201).json(SpinRandomResponseSchema.parse(result));
});

const AwardCoinsRequestSchema = z.object({
    winner: WheelItemSchema,
});

export const handleAwardCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = AwardCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Invalid winner" });
        return;
    }

    const spinToken = req.params!.spinToken!;
    const result = await awardCoins(req.userId!, spinToken, parsedBody.data.winner);
    res.status(200).json(AwardCoinsResponseSchema.parse(result));
});
