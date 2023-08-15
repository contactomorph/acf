const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

export const DATE_TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', DATE_TIME_OPTIONS);
