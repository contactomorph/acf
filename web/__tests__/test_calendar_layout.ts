import { test, expect } from '@jest/globals';
import { getWeekStart, shiftAnchor } from '../app/controllers/calendar_layout';
import { CalendarDay } from '../app/data/calendar_day';

test('getWeekStart returns the Monday of the current week', () => {
    // Wednesday 2026-09-23
    expect(getWeekStart(CalendarDay.fromDate(new Date(2026, 8, 23))))
        .toEqual(CalendarDay.fromDate(new Date(2026, 8, 21)));
    // Monday itself
    expect(getWeekStart(CalendarDay.fromDate(new Date(2026, 8, 21))))
        .toEqual(CalendarDay.fromDate(new Date(2026, 8, 21)));
    // Sunday 2026-09-27 belongs to the week starting 2026-09-21
    expect(getWeekStart(CalendarDay.fromDate(new Date(2026, 8, 27))))
        .toEqual(CalendarDay.fromDate(new Date(2026, 8, 21)));
});

test('getWeekStart handles month and year boundaries', () => {
    // Friday 2027-01-01 belongs to the week started 2026-12-28
    expect(getWeekStart(CalendarDay.fromDate(new Date(2027, 0, 1))))
        .toEqual(CalendarDay.fromDate(new Date(2026, 11, 28)));
});

test('shiftAnchor moves the window by stepWeeks weeks in the given direction', () => {
    const anchor = CalendarDay.fromDate(new Date(2026, 8, 23));
    expect(shiftAnchor(anchor, 1, 1)).toEqual(CalendarDay.fromDate(new Date(2026, 8, 28)));
    expect(shiftAnchor(anchor, 1, -1)).toEqual(CalendarDay.fromDate(new Date(2026, 8, 14)));
    expect(shiftAnchor(anchor, 2, 1)).toEqual(CalendarDay.fromDate(new Date(2026, 9, 5)));
    expect(shiftAnchor(anchor, 2, -1)).toEqual(CalendarDay.fromDate(new Date(2026, 8, 7)));
});

test('toKey formats days as YYYY-MM-DD', () => {
    expect(CalendarDay.fromDate(new Date(2026, 0, 5)).asString()).toBe('2026-01-05');
    expect(CalendarDay.fromDate(new Date(2026, 11, 31)).asString()).toBe('2026-12-31');
});
