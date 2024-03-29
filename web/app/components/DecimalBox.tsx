import DiscreteRange from '../tools/DiscreteRange';
import styles from './DecimalBox.module.css';
import { useEffect, useMemo, useRef } from "react";

function mayUpdateValue(
    valueRef: React.MutableRefObject<number>,
    candidateValue: number,
    range: DiscreteRange,
): boolean {
    if(!Number.isFinite(candidateValue))
        return false;
    const newValue = range.clamp(candidateValue);
    const updated = !Object.is(valueRef.current, newValue);
    valueRef.current = newValue;
    return updated;
}
function onKeyUp(e: React.KeyboardEvent<HTMLElement>): void {
    if (e.key === "Enter") {
        (e.target as HTMLElement).blur();
    }
}

export function DecimalBox(props: {
    onValueChange: (x: number) => void,
    value: number,
    minValue?: number,
    maxValue?: number,
    decimalCount?: number,
}) : JSX.Element {
    const { onValueChange, value, minValue, maxValue, decimalCount } = props;
    const range: DiscreteRange = useMemo(
        () => new DiscreteRange(decimalCount, minValue, maxValue),
        [decimalCount, minValue, maxValue],
    );

    const refKey = useRef<HTMLInputElement>(null);
    const valueRef = useRef(range.clamp(value));
    const isFirstCall = refKey.current === null;

    useEffect(() => {
        const updated = mayUpdateValue(valueRef, value, range);
        if (refKey.current) { refKey.current.value = range.toFixed(valueRef.current) }
        if (updated || isFirstCall) { onValueChange(valueRef.current) }
    }, [value, range, isFirstCall, onValueChange]);

    const onBlur = useMemo<React.ChangeEventHandler<HTMLInputElement>>(
        () => event => {
            const input = event.target;
            const updated = mayUpdateValue(valueRef, Number.parseFloat(input.value), range);
            input.value = range.toFixed(valueRef.current);
            if (updated) { onValueChange(valueRef.current) }
        },
        [range, onValueChange],
    );

    const onClick = useMemo<(positive: boolean) => void>(
        () => positive => {
            const candidateValue = valueRef.current + (positive ? + range.step : - range.step);
            const updated = mayUpdateValue(valueRef, candidateValue, range);
            if (refKey.current) { refKey.current.value = range.toFixed(valueRef.current) }
            if (updated) { onValueChange(valueRef.current) }
        },
        [range, onValueChange],
    );

    return (
      <div className={styles.BoxContainer}>
        <input
            type='button'
            role='minus'
            value="-"
            className={styles.BoxMinusButton}
            onClick={() => onClick(false)} />
        <input
            type="text"
            role="decimal_text"
            ref={refKey}
            className={styles.BoxText}
            onBlur={onBlur}
            onKeyUp={onKeyUp} />
        <input
            type='button'
            role='plus'
            value="+"
            className={styles.BoxPlusButton}
            onClick={() => onClick(true)} />
      </div>);
}
