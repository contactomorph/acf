import React, { useRef, useState } from 'react';
import styles from './ColorBox.module.css';

export type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export type Colorizer = (text: string) => ReadonlyArray<ColoredSpan>;

const NBSP = "\u00A0";

function extractSubText(
  text: string,
  from: number,
  to: number | null = null,
): string {
  return text.substring(from, to ?? text.length).replace(/ /g, NBSP);
}

function createChildren(
  spans: ReadonlyArray<ColoredSpan>,
  text: string,
): ReadonlyArray<JSX.Element> {
  let offset = 0;
  const children: Array<JSX.Element> = [];
  for (const span of spans) {
    if (span.textWidth <= 0) continue;
    const nextOffset = Math.min(offset + span.textWidth, text.length);
    if (offset >= nextOffset) break;
    const subText = extractSubText(text, offset, nextOffset);
    const properties = Object.getOwnPropertyNames(span);
    if (properties.length === 1 && properties[0] === "textWidth") {
      children.push(<React.Fragment key={offset}>{subText}</React.Fragment>);
    } else {
      children.push(<span key={offset} style={span}>{subText}</span>);
    }
    offset = nextOffset;
  }
  if (offset < text.length) {
    children.push(
      <React.Fragment key={offset}>
        {extractSubText(text, offset)}
      </React.Fragment>
    );
  }
  children.push(<React.Fragment key={offset + 1}>{NBSP}</React.Fragment>);
  return children;
}

function syncScrolling(
  destination: HTMLElement | null,
  source: HTMLElement,
): void {
  if (destination) {
    destination.scrollLeft = source.scrollLeft;
  }
}

function onKeyUp(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.key === "Enter") {
    (e.target as HTMLElement).blur();
  }
}

export function ColorBox(
  props: { colorizer: Colorizer, value: string, onChange: (text: string) => void, }
) : JSX.Element {
  const { colorizer, value, onChange } = props;
  const backdropRefObj = useRef<HTMLDivElement>(null);
  // View-only state: the coloring is only shown once the field loses focus.
  // While editing, the plain (black) text is displayed so the caret stays visible.
  const [colorized, setColorized] = useState(true);

  const content = colorized && value !== ""
    ? <>{createChildren(colorizer(value), value)}</>
    : <>{NBSP}</>;

  return (
    <div className={styles.BoxContainer}>
      <div className={styles.BoxBackdrop} ref={backdropRefObj}>
        <span className={styles.BoxFormula} role='formula'>{content}</span>
      </div>
      <input type='text'
        className={styles.BoxText}
        style={{color: colorized ? "transparent" : "black"}}
        value={value}
        onChange={e => { setColorized(false); onChange(e.target.value); }}
        onFocus={() => setColorized(false)}
        onBlur={() => setColorized(true)}
        onScroll={e => syncScrolling(backdropRefObj.current, e.target as HTMLElement) }
        onKeyUp={onKeyUp} />
    </div>);
}
