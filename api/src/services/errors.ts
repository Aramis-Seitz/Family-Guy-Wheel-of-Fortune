export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
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

