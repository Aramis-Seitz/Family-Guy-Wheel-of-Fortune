import { supabaseClient } from "../shared/supabase-client";
import { apiUrl } from "../shared/api-base";
import { t } from "../app/i18n";


type ApiErrorBody = {
    error?: string;
};


export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function readApiError(response: Response, fallbackKey: string): Promise<string> {
    try {
        const body = await response.json() as ApiErrorBody;
        if (body.error) console.error("API request failed:", body.error);
    } catch {
        // Keep fallback when response is not valid JSON.
    }
    return t(fallbackKey);
}

export async function getAccessToken(): Promise<string> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ?? '';
}

type HttpMethod = 'GET' | 'POST';

type RequestOptions = {
    token?: string;
    keepalive?: boolean;
    errorFallbackKey?: string;
};

async function request<T>(method: HttpMethod,
    path: string,
    body?: Record<string, unknown>,
    options: RequestOptions = {}
): Promise<T> {

    const token = options.token ?? await getAccessToken();

    const response = await fetch(apiUrl(path), {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        keepalive: options.keepalive,
    });

    if (!response.ok) {
        const message = await readApiError(response, options.errorFallbackKey ?? "api.generic");
        throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
}

export function postJson<T>(path: string, body?: Record<string, unknown>, options: RequestOptions = {}): Promise<T> {
    return request<T>('POST', path, body, options);
}

export function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return request<T>('GET', path, undefined, options);
}
