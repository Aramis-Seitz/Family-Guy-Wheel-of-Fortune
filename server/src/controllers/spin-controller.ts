import { z } from "zod";
import { generateSpin, awardCoins } from "../services/spin-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";

const GenerateSpinRequestSchema = z.object({
    names: z.array(z.string()),
});

export const handleGenerateSpin = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = GenerateSpinRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Missing names" });
        return;
    }

    // Solo-Spin: außer dem Spinner selbst sitzt hier niemand mit Account am Rad.
    const result = await generateSpin(req.userId!, parsedBody.data.names);
    res.status(201).json(SpinRandomResponseSchema.parse(result));
});

const AwardCoinsRequestSchema = z.object({
    winnerIndex: z.number().int().nonnegative(),
});

export const handleAwardCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = AwardCoinsRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Schema validation failure" });
        return;
    }

    const spinToken = req.params!.spinToken!;
    const result = await awardCoins(req.userId!, spinToken, parsedBody.data.winnerIndex);
    res.status(200).json(AwardCoinsResponseSchema.parse(result));
});
