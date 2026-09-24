import { useState } from 'react';
import styles from './TrainingCalendar.module.css';
import { CalendarDay } from '../data/calendar_day';
import { getWeekStart, shiftAnchor, formatMonth, WEEKDAY_LABELS, type CalendarStep } from '../controllers/calendar_layout';

const WEEK_COUNT = 5;
const NAVIGATION_STEP_WEEKS = 2;

const WEEKDAY_SPANS: ReadonlyArray<JSX.Element> = WEEKDAY_LABELS.map(label => (
    <span key={label} className={styles.WeekdayLabel}>{label}</span>
));

export type DayIdentifier = string;

export enum DayStatus { Matched, Unmatched }

function buildCalendarCells(
    anchorDay: CalendarDay,
    statusPerDay: ReadonlyMap<DayIdentifier, DayStatus>,
    selectedDay: CalendarDay | null,
    today: CalendarDay,
    onSelectDay: (day: CalendarDay) => void,
): JSX.Element[] {
    const cells: JSX.Element[] = [];
    for (let i = 0; i < WEEK_COUNT * 7; i += 1) {
        const day = anchorDay.addDays(i);
        cells.push(
            <DayCell
                key={day.asString()}
                day={day}
                status={statusPerDay.get(day.asString())}
                isSelected={selectedDay !== null && day.equals(selectedDay)}
                isToday={day.equals(today)}
                onSelectDay={onSelectDay}
            />
        );
    }
    return cells;
}

function DayCell(props: { 
    day: CalendarDay,
    status: DayStatus | undefined,
    isSelected: boolean,
    isToday: boolean,
    onSelectDay: (day: CalendarDay) => void,
}): JSX.Element {
    const { day, status, isSelected, isToday, onSelectDay } = props;
    const dayKey = day.asString();
    const classNames = [styles.Day];

    if (day.numericMonthFromZero % 2 === 1) {
        classNames.push(styles.OddMonth);
    }
    if (status !== undefined) {
        classNames.push(styles.HasSession);
    }
    if (isSelected) {
        classNames.push(styles.Selected);
    }
    if (isToday) {
        classNames.push(styles.Today);
    }

    const dotClassName = status === DayStatus.Matched ? styles.Dot : styles.DotUnmatched;

    const dot = status !== undefined ?
        <span className={dotClassName} aria-label='séance' /> :
        null;

    return (
        <div
            key={dayKey}
            role='calendar_day'
            aria-selected={isSelected}
            className={classNames.join(' ')}
            onClick={() => onSelectDay(day)}
        >
            <span className={styles.DayNumber}>{day.dayOfMonth}</span>{dot}
        </div>
    );
}

export function TrainingCalendar(props: {
    statusPerDay: ReadonlyMap<DayIdentifier, DayStatus>,
    selectedDay: CalendarDay | null,
    today: CalendarDay,
    onSelectDay: (day: CalendarDay) => void,
}): JSX.Element {
    const { statusPerDay, selectedDay, today, onSelectDay } = props;
    const [anchorDay, setAnchorDay] = useState<CalendarDay>(getWeekStart(today));

    const navigate = (step: CalendarStep) => {
        setAnchorDay(shiftAnchor(anchorDay, NAVIGATION_STEP_WEEKS, step));
    };

    const cells = buildCalendarCells(
        anchorDay,
        statusPerDay,
        selectedDay,
        today,
        onSelectDay);

    const monthAbove = formatMonth(anchorDay.addDays(-1));
    const monthBelow = formatMonth(anchorDay.addDays(WEEK_COUNT * 7));

    return (
        <div className={styles.Calendar}>
            <input
                type='button'
                className={styles.NavButton}
                value={`▲  ${monthAbove}  ▲`}
                onClick={() => navigate(-1)}
                aria-label='semaines précédentes'
            />
            <div className={styles.WeekdayRow}>{WEEKDAY_SPANS}</div>
            <div className={styles.Grid}>{cells}</div>
            <input
                type='button'
                className={styles.NavButton}
                value={`▼  ${monthBelow}  ▼`}
                onClick={() => navigate(1)}
                aria-label='semaines suivantes'
            />
        </div>
    );
}
