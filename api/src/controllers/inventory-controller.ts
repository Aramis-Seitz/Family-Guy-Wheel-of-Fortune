import { resolveUserIdFromHeaders } from "../services/auth-service";
import { getOwnedAssets } from "../services/inventory-service";
import { sendMethodNotAllowed, sendUnexpectedError } from "./response";
import type { HttpRequest, HttpResponse } from "../types/http";

export async function handleGetOwnedAssets(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res, "GET");
        return;
    }

    try {
        const userId = await resolveUserIdFromHeaders(req.headers);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assets = await getOwnedAssets(userId);
        res.status(200).json({ assets });
    } catch (error) {
        sendUnexpectedError(res, error);
    }
}