import { getLanguage } from "./i18n";

export function formatNumber(value: number): string {
    return new Intl.NumberFormat(getLanguage()).format(value);
}

export function formatDate(value: string | number | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(getLanguage(), {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(date);
}

export function formatTime(value: string | number | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(getLanguage(), {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatMultiplier(value: number): string {
    return new Intl.NumberFormat(getLanguage(), {
        maximumFractionDigits: 1,
    }).format(value);
}