import chroma from 'chroma-js';
import React from 'react';
import styles from './RunningBar.module.css';
import { Properties } from 'csstype';

export type Block = {
    readonly color: chroma.Color,
    readonly width: number,
    readonly icon: string;
    readonly texts: ReadonlyArray<string>,
};

function createBlock(proportion: number, block: Block) : JSX.Element {
    const texts = block.texts.map(t => (<><br/>{t}</>));
    const color = block.color;
    const backgroundColor = color.desaturate().hex();
    const borderColor = color.darken(2).hex();
    const textColor = color.luminance() > 0.5 ? color.darken(3).hex() : color.brighten(3).hex();
    const style: Properties = {
        width: `${100 * proportion}%`,
        borderColor,
        backgroundColor,
        color: textColor,
    };
    const title = `${block.icon}\n${block.texts.join('\n')}`;
    return (<div className={styles.BarBlock} style={style} title={title}>
        <span className={styles.BarHeader}>{block.icon}</span>{texts}
    </div>);
}

export function RunningBar(props: { blocks: ReadonlyArray<Block>, title: string }) : JSX.Element {
    const totalWidth = props.blocks.reduce((d, i) => d + i.width, 0);
    const runningIntervals = props.blocks.map(b => createBlock(b.width / totalWidth, b));
    return (<div className={styles.Bar}>
        <div className={styles.BarTitle}>{props.title}</div>
        <div className={styles.BarInner}>{runningIntervals}</div>
    </div>);
}

