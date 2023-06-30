"use client";
import styles from './DecimalBox.module.css';
import React from "react";

export type DecimalBoxConfig = {
    min: number,
    max: number,
    step: number,
};

export function DecimalBox(props: {
    updater: (x: number) => void,
    value: number,
    config: DecimalBoxConfig,
}) : JSX.Element {
    const updater = props.updater;
    const onChange = React.useMemo<React.ChangeEventHandler<HTMLInputElement>>(
        () => event => updater(parseFloat(event.target.value)),
        [updater]
    );
    return (
      <div className={styles.BoxContainer}>
        <input
            type='number'
            className={styles.BoxText}
            min={props.config.min}
            max={props.config.max}
            step={props.config.step}
            value={props.value}
            onChange={onChange} />
      </div>);
  }
  