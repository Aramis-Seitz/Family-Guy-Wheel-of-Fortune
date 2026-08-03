// Ersetzt echte Supabase-JWTs im Mock-Modus. Kein echtes Signing, nur
// Base64-JSON mit einem Präfix, das ihn als Mock-Token erkennbar macht.

export interface MockJwtPayload {
    id: string;
    email: string;
    username: string;
    date_of_birth: string | null;
}

const PREFIX = "mock_";

export function encodeMockJwt(payload: MockJwtPayload): string {
    return PREFIX + Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeMockJwt(jwt: string): MockJwtPayload | null {
    if (!jwt.startsWith(PREFIX)) return null;
    try {
        return JSON.parse(Buffer.from(jwt.slice(PREFIX.length), "base64").toString("utf8"));
    } catch {
        return null;
    }
}
