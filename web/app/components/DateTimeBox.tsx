import { useEffect, useState } from 'react';
import styles from './DateTimeBox.module.css';

const WEEKDAY_ABBREVIATIONS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface DateParts { year: number, month: number, day: number }
interface TimeParts { hour: number, minute: number }

const DATE_REGEXP = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const TIME_REGEXP = /^(\d{1,2}):(\d{2})$/;

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

export function formatDatePart(date: Date | null): string {
    if (!date) return '';
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear().toString().padStart(4, '0')}`;
}

export function formatTimePart(date: Date | null): string {
    if (!date) return '';
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatePart(text: string): DateParts | null {
    const match = DATE_REGEXP.exec(text.trim());
    if (!match) return null;
    const [, dayText, monthText, yearText] = match;
    const day = Number.parseInt(dayText, 10);
    const month = Number.parseInt(monthText, 10);
    const year = Number.parseInt(yearText, 10);
    const asDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    const isValid = asDate.getFullYear() === year &&
        asDate.getMonth() === month - 1 &&
        asDate.getDate() === day;
    return isValid ? { year, month, day } : null;
}

export function parseTimePart(text: string): TimeParts | null {
    const match = TIME_REGEXP.exec(text.trim());
    if (!match) return null;
    const [, hourText, minuteText] = match;
    const hour = Number.parseInt(hourText, 10);
    const minute = Number.parseInt(minuteText, 10);
    if (hour < 0 || 23 < hour || minute < 0 || 59 < minute) return null;
    return { hour, minute };
}

function getWeekdayAbbreviation(dateText: string): string {
    const dateParts = parseDatePart(dateText);
    if (dateParts === null) return '';

    const weekday = new Date(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        12,
        0,
        0,
        0,
    ).getDay();

    return WEEKDAY_ABBREVIATIONS[weekday];
}

function handleBlur(
    dateText: string,
    timeText: string,
    date: Date | null,
    setDate: (date: Date | null) => void,
    setDateText: (nextText: string) => void,
    setTimeText: (nextText: string) => void,
): void {
    const parsedDate = parseDatePart(dateText);

    if (parsedDate !== null) {
        const parsedTime = parseTimePart(timeText);

        if (parsedTime !== null) {
            const combined = new Date(
                parsedDate.year,
                parsedDate.month - 1,
                parsedDate.day,
                parsedTime.hour,
                parsedTime.minute,
                0,
                0,
            );
            setDate(combined);
        }
        else if (timeText === '') {
            const combined = new Date(
                parsedDate.year,
                parsedDate.month - 1,
                parsedDate.day,
                12,
                0,
                0,
                0,
            );
            setTimeText(formatTimePart(combined));
            setDate(combined);
        }
        else {
            setTimeText(formatTimePart(date));
        }
    }
    else {
        if (dateText === '') {
            setDate(null);
        }
        else {
            setDateText(formatDatePart(date));
        }
    }
}

export function DateTimeBox(props: {
    date: Date | null,
    onDateChange: (date: Date | null) => void,
}) : JSX.Element {
    const { date, onDateChange } = props;

    const [dateText, setDateText] = useState(formatDatePart(date));
    const [timeText, setTimeText] = useState(formatTimePart(date));

    useEffect(() => {
        setDateText(formatDatePart(date));
        setTimeText(formatTimePart(date));
    }, [date]);

    const weekdayLabel = getWeekdayAbbreviation(dateText);

    return (
        <span>
            <span className={styles.WeekdayLabel}>{weekdayLabel}</span>
            <span>&nbsp;</span>
            <input
                type='text'
                role='dateText'
                placeholder='jj/mm/aaaa'
                value={dateText}
                onChange={(event) => setDateText(event.target.value)}
                onBlur={() => handleBlur(dateText, timeText, date, onDateChange, setDateText, setTimeText)}
            />
            <span>&nbsp;</span>
            <input
                type='text'
                role='timeText'
                placeholder='HH:mm'
                value={timeText}
                onChange={(event) => setTimeText(event.target.value)}
                onBlur={() => handleBlur(dateText, timeText, date, onDateChange, setDateText, setTimeText)}
            />
        </span>
    );
}
