import type { NextFunction } from "express";
import type { HttpRequest, HttpResponse } from "../controllers/response";

export function requireSelf(req: HttpRequest, res: HttpResponse, next: NextFunction, userId: string): void {
    if (userId !== req.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    next();
}
