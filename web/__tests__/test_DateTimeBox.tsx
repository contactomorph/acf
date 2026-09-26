import { test, expect, jest } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';
import { DateTimeBox } from '../app/components/DateTimeBox';

function getInputValue(role: string): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return (screen.getByRole(role) as HTMLInputElement).value;
}

test('DateTimeBox displays formatted date and time from value', () => {
    render(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={() => {}} />);

    expect(getInputValue('dateText')).toBe('23/09/2026');
    expect(getInputValue('timeText')).toBe('19:30');
});

test('DateTimeBox displays empty fields when value is null', () => {
    render(<DateTimeBox date={null} onDateChange={() => {}} />);

    expect(getInputValue('dateText')).toBe('');
    expect(getInputValue('timeText')).toBe('');
});

test('DateTimeBox displays and updates the weekday abbreviation as the date is typed', () => {
    // 2026-09-23 is a Wednesday, 2026-09-26 is a Saturday.
    render(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={() => {}} />);

    expect(screen.getByText('Mer')).not.toBeNull();

    fireEvent.change(screen.getByRole('dateText'), { target: { value: '26/09/2026' } });

    expect(screen.getByText('Sam')).not.toBeNull();
});

test('DateTimeBox shows no weekday when the date text is invalid', () => {
    render(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={() => {}} />);

    fireEvent.change(screen.getByRole('dateText'), { target: { value: '32/13/2026' } });

    expect(screen.queryByText('Mer')).toBeNull();
});

test('valid date with invalid/empty time falls back to 19:30', () => {
    const onChange = jest.fn();
    render(<DateTimeBox date={null} onDateChange={onChange} />);

    fireEvent.change(screen.getByRole('dateText'), { target: { value: '23/09/2026' } });
    fireEvent.blur(screen.getByRole('dateText'));

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 8, 23, 12, 0));
});

test('valid time with invalid/empty date results in null', () => {
    const onChange = jest.fn();
    render(<DateTimeBox date={null} onDateChange={onChange} />);

    fireEvent.change(screen.getByRole('timeText'), { target: { value: '08:15' } });
    fireEvent.blur(screen.getByRole('timeText'));

    expect(onChange).toHaveBeenCalledWith(null);
});

test('both valid date and time are combined', () => {
    const onChange = jest.fn();
    render(<DateTimeBox date={null} onDateChange={onChange} />);

    fireEvent.change(screen.getByRole('dateText'), { target: { value: '23/09/2026' } });
    fireEvent.blur(screen.getByRole('dateText'));
    fireEvent.change(screen.getByRole('timeText'), { target: { value: '08:15' } });
    fireEvent.blur(screen.getByRole('timeText'));

    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 8, 23, 8, 15));
});

test('invalid date text is rejected and reverts to last valid value', () => {
    const onChange = jest.fn();
    const { rerender } = render(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={onChange} />);

    fireEvent.change(screen.getByRole('dateText'), { target: { value: '32/13/2026' } });
    fireEvent.blur(screen.getByRole('dateText'));

    expect(onChange).not.toHaveBeenCalled();
    expect(getInputValue('dateText')).toBe('23/09/2026');
    rerender(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={onChange} />);
});

test('invalid time text is rejected and reverts to last valid value', () => {
    const onChange = jest.fn();
    render(<DateTimeBox date={new Date(2026, 8, 23, 19, 30)} onDateChange={onChange} />);

    fireEvent.change(screen.getByRole('timeText'), { target: { value: '25:99' } });
    fireEvent.blur(screen.getByRole('timeText'));

    expect(onChange).not.toHaveBeenCalled();
    expect(getInputValue('timeText')).toBe('19:30');
});
