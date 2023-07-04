"use client";
import styles from './DecimalBox.module.css';
import React from "react";

export function DecimalBox(props: {
    onValueChange: (x: number) => void,
    value: number,
    minValue?: number,
    maxValue?: number,
    step?: number,
}) : JSX.Element {
    const onValueChange = props.onValueChange;
    const onChange = React.useMemo<React.ChangeEventHandler<HTMLInputElement>>(
        () => event => {
            const text = event.target.value;
            if (typeof text === "string") {
                const value = parseFloat(text);
                if (Number.isFinite(value)) {
                    onValueChange(value);
                }
            }
        },
        [onValueChange],
    );
    return (
      <div className={styles.BoxContainer}>
        <input
            type='number'
            className={styles.BoxText}
            min={props.minValue ?? 0}
            max={props.maxValue ?? 100}
            step={props.step ?? 1}
            value={props.value}
            onChange={onChange} />
      </div>);
  }
  