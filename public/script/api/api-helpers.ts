import { supabaseClient } from "../shared/supabase-client";
import { apiUrl } from "../shared/api-base";
import i18next from "i18next";
import { t } from "../app/i18n";


type ApiErrorBody = {
    error?: string;
    code?: string;
    details?: Record<string, unknown>;
};


export class ApiError extends Error {
    status: number;
    code?: string;
    details?: Record<string, unknown>;

    constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

const ERROR_CODE_KEYS: Record<string, string> = {
    AUTH_UNAUTHORIZED: 'errors.unauthorized',
    VALIDATION_ERROR: 'errors.validation',
    RESOURCE_NOT_FOUND: 'errors.notFound',
    RESOURCE_CONFLICT: 'errors.conflict',
    INSUFFICIENT_COINS: 'errors.insufficientCoins',
    FORBIDDEN: 'errors.forbidden',
    METHOD_NOT_ALLOWED: 'errors.methodNotAllowed',
    INTERNAL_ERROR: 'errors.internal',
};

export async function readApiError(response: Response, fallbackKey: string): Promise<{ message: string; code?: string; details?: Record<string, unknown> }> {
    try {
        const body = await response.json() as ApiErrorBody;
        const translationKey = body.code ? ERROR_CODE_KEYS[body.code] : undefined;
        if (translationKey) {
            return { message: t(translationKey, body.details), code: body.code, details: body.details };
        }
        if (body.error) return { message: body.error, code: body.code, details: body.details };
    } catch {
        // Keep fallback when response is not valid JSON.
    }
    return { message: t(fallbackKey) };
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
            'Accept-Language': i18next.resolvedLanguage ?? i18next.language ?? 'en',
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        keepalive: options.keepalive,
    });

    if (!response.ok) {
        const apiError = await readApiError(response, options.errorFallbackKey ?? 'errors.generic');
        throw new ApiError(apiError.message, response.status, apiError.code, apiError.details);
    }
    return response.json() as Promise<T>;
}

export function postJson<T>(path: string, body?: Record<string, unknown>, options: RequestOptions = {}): Promise<T> {
    return request<T>('POST', path, body, options);
}

export function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return request<T>('GET', path, undefined, options);
}
