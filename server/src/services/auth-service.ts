import { supabaseClient } from "../lib/supabase-client";
import { decodeMockJwt } from "../mock/routes";
import type { HttpHeaders } from "../controllers/response";

const USE_MOCK = process.env.USE_MOCK === "true";

function headerValue(value: string | string[] | undefined): string {
    if (!value) return "";
    if (Array.isArray(value)) return value[0] ?? "";
    return value;
}

export function extractBearerToken(headers?: HttpHeaders): string {
    const rawAuthorization = headerValue(headers?.authorization);
    return String(rawAuthorization).replace(/^Bearer\s+/i, "").trim();
}

export async function resolveUserIdFromToken(token: string): Promise<string | null> {
    if (!token) return null;

    if (USE_MOCK) return decodeMockJwt(token)?.id ?? null;

    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

export async function resolveUserIdFromHeaders(headers?: HttpHeaders): Promise<string | null> {
    const token = extractBearerToken(headers);
    return resolveUserIdFromToken(token);
}
