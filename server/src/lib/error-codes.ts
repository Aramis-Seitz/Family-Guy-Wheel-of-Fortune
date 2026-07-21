export const ERROR_CODES = {
    UNAUTHORIZED: "AUTH_UNAUTHORIZED",
    VALIDATION: "VALIDATION_ERROR",
    NOT_FOUND: "RESOURCE_NOT_FOUND",
    CONFLICT: "RESOURCE_CONFLICT",
    INSUFFICIENT_COINS: "INSUFFICIENT_COINS",
    FORBIDDEN: "FORBIDDEN",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    INTERNAL: "INTERNAL_ERROR",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export function inferErrorCode(message: string, statusCode: number): ErrorCode {
    if (statusCode === 401) return ERROR_CODES.UNAUTHORIZED;
    if (statusCode === 403) return ERROR_CODES.FORBIDDEN;
    if (statusCode === 404) return ERROR_CODES.NOT_FOUND;
    if (statusCode === 405) return ERROR_CODES.METHOD_NOT_ALLOWED;
    if (statusCode === 409) return ERROR_CODES.CONFLICT;
    if (/not enough coins/i.test(message)) return ERROR_CODES.INSUFFICIENT_COINS;
    if (statusCode >= 400 && statusCode < 500) return ERROR_CODES.VALIDATION;
    return ERROR_CODES.INTERNAL;
}
