/**
 * A calendar day (year/month/day, no time, no timezone concern).
 * Internally converts to/from `Date` always at noon (local time), so that
 * daylight-saving-time changes can never cause an off-by-one-day error.
 */
export class CalendarDay {
    private readonly _year: number;
    private readonly _month: number; // 0-11, like Date.getMonth()
    private readonly _day: number;

    private constructor(year: number, month: number, day: number) {
        this._year = year;
        this._month = month;
        this._day = day;
    }

    static fromDate(date: Date): CalendarDay {
        return new CalendarDay(date.getFullYear(), date.getMonth(), date.getDate());
    }

    static today(): CalendarDay {
        return CalendarDay.fromDate(new Date());
    }

    toDate(): Date {
        return new Date(this._year, this._month, this._day, 12, 0, 0, 0);
    }

    addDays(count: number): CalendarDay {
        const shifted = new Date(this._year, this._month, this._day + count, 12, 0, 0, 0);
        return CalendarDay.fromDate(shifted);
    }

    equals(other: CalendarDay): boolean {
        return this._year === other._year &&
            this._month === other._month &&
            this._day === other._day;
    }

    get year(): number {
        return this._year;
    }

    get numericMonthFromZero(): number {
        return this._month;
    }

    get dayOfMonth(): number {
        return this._day;
    }

    asString(): string {
        const year = this._year.toString().padStart(4, '0');
        const month = (this._month + 1).toString().padStart(2, '0');
        const day = this._day.toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
