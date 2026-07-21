import { inferErrorCode } from "./error-codes";
import type { ErrorCode } from "./error-codes";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, statusCode: number, code?: ErrorCode, details?: Record<string, unknown>) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code ?? inferErrorCode(message, statusCode);
        this.details = details;
    }
}

export function asAppError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) return new AppError(error.message, 500);
    if (typeof error === "object" && error !== null && "message" in error) {
        return new AppError(String((error as { message: unknown }).message), 500);
    }
    return new AppError("Internal server error", 500);
}
