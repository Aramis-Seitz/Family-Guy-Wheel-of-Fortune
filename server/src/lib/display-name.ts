export function formatDisplayName(username: string, suffix: number): string {
    return `${username}#${String(suffix).padStart(2, "0")}`;
}

export function parseDisplayName(display: string): { username: string; suffix: number } | null {
    const match = /^(.+)#(\d{2})$/.exec(display);
    if (!match) return null;
    return { username: match[1], suffix: Number(match[2]) };
}
