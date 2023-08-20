const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
};

export const DATE_TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', DATE_TIME_OPTIONS);

export function parseIso(text: string): Date | null {
    const n = Date.parse(text);
    return Number.isFinite(n)? new Date(n) : null;
}