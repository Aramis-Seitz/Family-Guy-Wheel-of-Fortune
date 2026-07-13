import { z } from "zod";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import { generateSpin, awardCoins } from "../services/spin-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";

export async function handleGenerateSpin(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await generateSpin(userId);
        res.status(200).json(SpinRandomResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

const AwardCoinsRequestSchema = z.object({
    spinToken: z.string().min(1),
    winnerName: z.string().min(1),
});

export async function handleAwardCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = AwardCoinsRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "Missing spinToken or winnerName" });
            return;
        }

        const result = await awardCoins(userId, parsedBody.data.spinToken, parsedBody.data.winnerName);
        res.status(200).json(AwardCoinsResponseSchema.parse(result));
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
