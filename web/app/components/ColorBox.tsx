import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ColorBox.module.css';

export type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export type Colorizer = (text: string) => ReadonlyArray<ColoredSpan>;

const NBSP = "\u00A0";
const EMPTY_CONTENT: JSX.Element = (<>{NBSP}</>);

class ColorizingDaemon {
  private readonly _setContent: (arg: JSX.Element) => void;
  private readonly _colorizer: Colorizer;

  constructor(
    setContent: (arg: JSX.Element) => void,
    colorizer: Colorizer,
  ) {
    this._setContent = setContent;
    this._colorizer = colorizer;
  }

  public injectText(text: string): void {
    const spans = this._colorizer(text);
    const children = ColorizingDaemon._createChildren(spans, text);
    this._setContent(<>{children}</>);
  }

  public clearText() {
    this._setContent(EMPTY_CONTENT);
  }

  private static _createChildren(
    spans: ReadonlyArray<ColoredSpan>,
    text: string,
  ): ReadonlyArray<JSX.Element> {
    let offset = 0;
    const children: Array<JSX.Element> = [];
    for(const span of spans) {
      if (span.textWidth <= 0) continue;
      const nextOffset = Math.min(offset + span.textWidth, text.length);
      if (offset >= nextOffset) break;
      const subText = ColorizingDaemon._extractSubText(text, offset, nextOffset);
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
          {ColorizingDaemon._extractSubText(text, offset)}
        </React.Fragment>
      );
    }
    children.push(<React.Fragment key={offset+1}>{NBSP}</React.Fragment>);
    return children;
  }

  private static _extractSubText(
    text: string,
    from: number,
    to: number | null = null,
  ): string {
    return text.substring(from, to ?? text.length).replace(/ /g, NBSP);
  }
}

function syncScrolling(
  destination: HTMLElement | null,
  source: HTMLElement,
): void {
  if (destination) {
    destination.scrollLeft = source.scrollLeft;
  }
}

export function ColorBox(
  props: { colorizer: Colorizer, text?: string, }
) : JSX.Element {
  const formulaRefObj = useRef<HTMLInputElement>(null);
  const backdropRefObj = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(EMPTY_CONTENT);

  const color = content === EMPTY_CONTENT ? "black" : "transparent";

  useEffect(() => {
    const textInput = formulaRefObj.current;
    const backdrop = backdropRefObj.current;
    if (backdrop !== null && textInput !== null) {
      backdrop.scrollLeft = textInput.scrollLeft;
    }
  });

  const daemon = useMemo(() => {
    return new ColorizingDaemon(setContent, props.colorizer);
  }, [props.colorizer]);

  useEffect(() => {
    if (props.text !== undefined && formulaRefObj.current) {
      formulaRefObj.current.value = props.text;
      daemon.injectText(props.text);
    }
  }, [props.colorizer, props.text]);

  return (
    <div className={styles.BoxContainer}>
      <div className={styles.BoxBackdrop} ref={backdropRefObj}>
        <span className={styles.BoxFormula} role='formula'>{content}</span>
      </div>
      <input type='text'
        className={styles.BoxText}
        style={{color}}
        ref={formulaRefObj}
        onScroll={e => syncScrolling(backdropRefObj.current, e.target as HTMLElement) }
        onInput={() => daemon.clearText()}
        onClick={() => daemon.clearText()}
        onBlur={e => daemon.injectText(e.target.value)} />
    </div>);
}
