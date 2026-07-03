import { supabaseClient } from "../shared/supabase-client.js";


type ApiErrorBody = {
    error?: string;
};


export async function readApiError(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json() as ApiErrorBody;
        if (body.error) return body.error;
    } catch {
        // Keep fallback when response is not valid JSON.
    }
    return fallback;
}

export async function buildAuthHeaders(baseHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    return {
        ...baseHeaders,
        Authorization: `Bearer ${token}`
    };
}

export async function getAccessToken(): Promise<string> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ?? '';
}

export async function postJson<T>(path: string, body?: Record<string, unknown>, options: { token?: string; keepalive?: boolean } = {}): Promise<T> {
    const token = options.token ?? await getAccessToken();

    const response = await fetch(path, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        keepalive: options.keepalive,
    });

    if (!response.ok) throw new Error(await readApiError(response, `HTTP ${response.status}`));
    return response.json() as Promise<T>;
}
