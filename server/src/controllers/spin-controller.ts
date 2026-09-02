import { z } from "zod";
import { generateSpin, awardCoins } from "../services/spin-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";

const GenerateSpinRequestSchema = z.object({
    names: z.array(z.string()),
    multiplier: z.number().min(1).max(2),
    direction: z.enum(["left", "right"]),
});

export const handleGenerateSpin = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = GenerateSpinRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "Invalid spin request" });
        return;
    }

    // Solo-Spin: außer dem Spinner selbst sitzt hier niemand mit Account am Rad.
    const { names, multiplier, direction } = parsedBody.data;
    const result = await generateSpin(req.userId!, names, { multiplier, direction });
    res.status(201).json(SpinRandomResponseSchema.parse(result));
});

export const handleAwardCoins = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {

    const spinToken = req.params!.spinToken!;
    const result = await awardCoins(req.userId!, spinToken);
    res.status(200).json(AwardCoinsResponseSchema.parse(result));
});
