import { test, expect, jest } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';
import { TrainingCalendar, DayStatus } from '../app/components/TrainingCalendar';
import { getWeekStart } from '../app/controllers/calendar_layout';
import { CalendarDay } from '../app/data/calendar_day';

test('TrainingCalendar renders a dot only on days with a session', () => {
    const today = CalendarDay.fromDate(new Date(2026, 8, 23));
    const monday = getWeekStart(today);
    const statusPerDay = new Map<string, DayStatus>([[monday.addDays(2).asString(), DayStatus.Matched]]);

    render(<TrainingCalendar
        statusPerDay={statusPerDay}
        selectedDay={null}
        today={today}
        onSelectDay={() => {}}
    />);

    const days = screen.getAllByRole('calendar_day');
    expect(days[2].querySelector('[aria-label="séance"]')).not.toBeNull();
    expect(days[0].querySelector('[aria-label="séance"]')).toBeNull();
});

test('TrainingCalendar keeps the dot visible but greyed out for sessions not matching the filter', () => {
    const today = CalendarDay.fromDate(new Date(2026, 8, 23));
    const monday = getWeekStart(today);
    const statusPerDay = new Map<string, DayStatus>([[monday.addDays(2).asString(), DayStatus.Unmatched]]);

    render(<TrainingCalendar
        statusPerDay={statusPerDay}
        selectedDay={null}
        today={today}
        onSelectDay={() => {}}
    />);

    const days = screen.getAllByRole('calendar_day');
    const dot = days[2].querySelector('[aria-label="séance"]');
    expect(dot).not.toBeNull();
    expect(dot?.className).toContain('DotUnmatched');
});

test('TrainingCalendar calls onSelectDay when a day is clicked', () => {
    const today = CalendarDay.fromDate(new Date(2026, 8, 23));
    const monday = getWeekStart(today);
    const onSelectDay = jest.fn();

    render(<TrainingCalendar
        statusPerDay={new Map()}
        selectedDay={null}
        today={today}
        onSelectDay={onSelectDay}
    />);

    fireEvent.click(screen.getAllByRole('calendar_day')[3]);

    expect(onSelectDay).toHaveBeenCalledWith(monday.addDays(3));
});

test('TrainingCalendar navigates internally without notifying the parent', () => {
    const today = CalendarDay.fromDate(new Date(2026, 8, 23));

    render(<TrainingCalendar
        statusPerDay={new Map()}
        selectedDay={null}
        today={today}
        onSelectDay={() => {}}
    />);

    const firstBefore = screen.getAllByRole('calendar_day')[0].textContent;

    fireEvent.click(screen.getByLabelText('semaines suivantes'));

    const firstAfter = screen.getAllByRole('calendar_day')[0].textContent;
    expect(firstAfter).not.toBe(firstBefore);
});
