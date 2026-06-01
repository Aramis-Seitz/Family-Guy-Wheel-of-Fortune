import type { HttpResponse } from "../types/http";
import { asAppError } from "../services/errors";

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
