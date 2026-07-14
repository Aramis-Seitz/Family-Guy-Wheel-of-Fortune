import type { NextFunction } from "express";
import { resolveUserIdFromHeaders } from "../services/auth-service";
import type { HttpRequest, HttpResponse } from "../controllers/response";

export async function requireAuth(req: HttpRequest, res: HttpResponse, next: NextFunction): Promise<void> {
    const userId = await resolveUserIdFromHeaders(req.headers);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    req.userId = userId;
    next();
}
