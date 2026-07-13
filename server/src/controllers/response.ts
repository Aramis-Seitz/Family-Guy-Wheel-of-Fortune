import { asAppError } from "../lib/errors";

export type HttpHeaders = Record<string, string | string[] | undefined>;

export interface HttpRequest {
    method?: string;
    headers?: HttpHeaders;
    body?: unknown;
    query?: unknown;
    params?: Record<string, string | undefined>;
    userId?: string;
}

export interface HttpResponse {
    status(code: number): HttpResponse;
    json(body: unknown): unknown;
    setHeader?(name: string, value: string): void;
}

export function sendMethodNotAllowed(res: HttpResponse, allow: string): void {
    if (typeof res.setHeader === "function") {
        res.setHeader("Allow", allow);
    }
    res.status(405).json({ error: "Method not allowed" });
}

export function sendUnexpectedError(res: HttpResponse, error: unknown): void {
    const appError = asAppError(error);
    res.status(appError.statusCode).json({ error: appError.message });
}

export function asyncHandler(handler: (req: HttpRequest, res: HttpResponse) => Promise<void>) {
    return async (req: HttpRequest, res: HttpResponse): Promise<void> => {
        try {
            await handler(req, res);
        } catch (error) {
            sendUnexpectedError(res, error);
        }
    };
}
