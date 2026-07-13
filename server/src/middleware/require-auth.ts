import type { NextFunction, Request, Response } from "express";
import { resolveUserIdFromHeaders } from "../services/auth-service";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = await resolveUserIdFromHeaders(req.headers);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    req.userId = userId;
    next();
}
