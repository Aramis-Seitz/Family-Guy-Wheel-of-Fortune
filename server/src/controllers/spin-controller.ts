import { resolveUserIdFromHeaders } from "../services/auth-service";
import { generateSpin, awardCoins } from "../services/spin-service";
import { sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "./response";

export async function handleGenerateSpin(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await generateSpin(userId);
        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}

type AwardCoinsBody = {
    spinToken?: string;
    winnerName?: string;
};

export async function handleAwardCoins(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { spinToken, winnerName } = (req.body ?? {}) as AwardCoinsBody;
        if (!spinToken || !winnerName) {
            res.status(400).json({ error: "Missing spinToken or winnerName" });
            return;
        }

        const result = await awardCoins(userId, spinToken, winnerName);
        res.status(200).json(result);
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}
