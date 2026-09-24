import { CalendarDay } from '../data/calendar_day';

export type CalendarStep = -1 | 1;

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const MONTH_FORMAT = new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' });

export function formatMonth(day: CalendarDay): string {
    return MONTH_FORMAT.format(day.toDate());
}

/**
 * Returns the Monday of the week containing the given day.
 */
export function getWeekStart(day: CalendarDay): CalendarDay {
    const isoDayOfWeek = (day.toDate().getDay() + 6) % 7; // Monday === 0
    return day.addDays(-isoDayOfWeek);
}

/**
 * Returns the anchor day to use after shifting the current window by
 * `stepWeeks` weeks in the given navigation step.
 */
export function shiftAnchor(anchorDay: CalendarDay, stepWeeks: number, step: CalendarStep): CalendarDay {
    const start = getWeekStart(anchorDay);
    return start.addDays(step * stepWeeks * 7);
}
