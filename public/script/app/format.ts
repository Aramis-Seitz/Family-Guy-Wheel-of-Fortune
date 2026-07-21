import i18next from 'i18next';

function locale(): string {
    return i18next.resolvedLanguage ?? i18next.language ?? 'en';
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat(locale()).format(value);
}

export function formatDate(value: string | number | Date, options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
}): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale(), options).format(date);
}

export function formatTime(value: string | number | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale(), {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
