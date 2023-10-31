"use client";
import chroma from 'chroma-js';
import styles from './RunningBar.module.css';
import { Properties } from 'csstype';
import { useEffect, useRef } from 'react';

export type Block = {
    readonly color: chroma.Color,
    readonly width: number,
    readonly icon: string;
    readonly texts: ReadonlyArray<string>,
};

function RunningBlock(props: { block: Block, proportion: number }) : JSX.Element {
    const block = props.block;
    const texts = block.texts.map(t => (<><br/>{t}</>));
    const color = block.color;
    const backgroundColor = color.desaturate().hex();
    const borderColor = color.darken(2).hex();
    const textColor = color.luminance() > 0.5 ? color.darken(3).hex() : color.brighten(3).hex();
    const style: Properties = {
        width: `${100 * props.proportion}%`,
        borderColor,
        backgroundColor,
        color: textColor,
    };
    const title = `${block.icon}\n${block.texts.join('\n')}`;
    return (<div role="running_block" className={styles.BarBlock} style={style} title={title}>
        <span className={styles.BarHeader}>{block.icon}</span>{texts}
    </div>);
}

const MINIMAL_ACCEPTABLE_PX_SIZE = 50;

function mayExtendSequence(
    inner: HTMLDivElement,
    seq: HTMLDivElement,
    minProportion: number
) {
    const minWidthIfContracted = inner.clientWidth * minProportion;
    if (minWidthIfContracted < MINIMAL_ACCEPTABLE_PX_SIZE) {
        const extendedPercentage = Math.floor(
            100 * MINIMAL_ACCEPTABLE_PX_SIZE / minWidthIfContracted
        );
        inner.style.overflowX = "scroll";
        seq.style.width = `${extendedPercentage}%`;
    } else {
        seq.style.width = "100%";
        inner.style.overflowX = 'auto';
    }
}

export function RunningBar(
    props: { blocks: ReadonlyArray<Block>, title: string }
) : JSX.Element {
    const totalWidth = props.blocks.reduce((w, b) => w + b.width, 0);

    const minProportionRef = useRef(1.0);
    minProportionRef.current = props.blocks.reduce(
        (mp, b) => Math.min(b.width / totalWidth, mp),
        1.0,
    );

    const innerRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (innerRef.current !== null && seqRef.current !== null) {
            mayExtendSequence(innerRef.current, seqRef.current, minProportionRef.current);
        }
    });

    useEffect(() => {
        if (window?.ResizeObserver) {
            const observer = new window.ResizeObserver(() => {
                mayExtendSequence(innerRef.current!, seqRef.current!, minProportionRef.current);
            });
            observer.observe(innerRef.current!);
            return () => { observer.disconnect() };
        }
    }, []);

    const runningBlocks = props.blocks.map(
        b => (<RunningBlock proportion={b.width / totalWidth} block={b}/>)
    );
    return (<div className={styles.Bar}>
        <div className={styles.BarTitle}>{props.title}</div>
        <div ref={innerRef} className={styles.BarInner}>
            <div ref={seqRef} className={styles.BarBlockSequence}>{runningBlocks}</div>
        </div>
    </div>);
}
