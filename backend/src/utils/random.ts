import crypto from "crypto";

export function getSecureRandomNumber(min: number, max: number): number {
    return crypto.randomInt(min, max + 1);
}