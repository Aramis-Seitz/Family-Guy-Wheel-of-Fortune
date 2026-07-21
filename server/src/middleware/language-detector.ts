import type { NextFunction, Request, Response } from "express";

export type SupportedLanguage = "de" | "en";

export function resolveLanguage(header: string | undefined, queryLanguage: unknown): SupportedLanguage {
    const query = typeof queryLanguage === "string" ? queryLanguage.toLowerCase().split("-")[0] : undefined;
    if (query === "de" || query === "en") return query;

    const candidates = (header ?? "")
        .split(",")
        .map((part) => part.trim().split(";")[0]?.toLowerCase().split("-")[0]);

    return candidates.includes("de") ? "de" : "en";
}

export function detectLanguage(req: Request, res: Response, next: NextFunction): void {
    const language = resolveLanguage(req.headers["accept-language"], req.query.lang);
    res.locals.language = language;
    res.setHeader("Content-Language", language);
    res.vary("Accept-Language");
    next();
}
