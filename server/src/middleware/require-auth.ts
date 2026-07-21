import type { NextFunction } from "express";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import type { HttpRequest, HttpResponse } from "../controllers/response";
import { ERROR_CODES } from "../lib/error-codes";

export async function requireAuth(req: HttpRequest, res: HttpResponse, next: NextFunction): Promise<void> {
    const userId = await resolveUserIdFromHeaders(req.headers);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized", code: ERROR_CODES.UNAUTHORIZED });
        return;
    }

    req.userId = userId;
    next();
}
