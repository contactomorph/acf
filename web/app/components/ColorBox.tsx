"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ColorBox.module.css';

export type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export type Colorizer = (text: string) => Promise<ReadonlyArray<ColoredSpan>>;

const NBSP = "\u00A0";
const DEFAULT_DELAY_IN_MS = 1000;
const EMPTY_CONTENT: JSX.Element = (<>{NBSP}</>);

class ColorizingDaemon {
  private readonly _setContent: (arg: JSX.Element) => void;
  private readonly _colorizer: Colorizer;
  private _version: number;
  public delayInMs: number;

  constructor(
    setContent: (arg: JSX.Element) => void,
    colorizer: Colorizer,
    delayInMs: number,
  ) {
    this._setContent = setContent;
    this._colorizer = colorizer;
    this.delayInMs = delayInMs;
    this._version = 0;
  }

  public injectTextAfterTimeout(text: string): void {
    ++this._version;
    const currentVersion = this._version;
    this._setContent(EMPTY_CONTENT);
    setTimeout(() => this._injectText(text, currentVersion), this.delayInMs);
  }

  public async injectTextNow(text: string): Promise<void> {
    ++this._version;
    const candidateVersion = this._version;
    const spans = await this._colorizer(text);
    if (this._version !== candidateVersion) return;
    const children = ColorizingDaemon._createChildren(spans, text);
    this._setContent(<>{children}</>);
  }

  private async _injectText(text: string, candidateVersion: number): Promise<void> {
    if (this._version !== candidateVersion) return;
    const spans = await this._colorizer(text);
    if (this._version !== candidateVersion) return;
    const children = ColorizingDaemon._createChildren(spans, text);
    this._setContent(<>{children}</>);
  }

  public clearText() {
    ++this._version;
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

function syncScrolling(destination: HTMLElement | null, source: HTMLElement): void {
  if (destination) {
    destination.scrollLeft = source.scrollLeft;
  }
}

async function blacken(
  daemon: ColorizingDaemon,
  textInput: HTMLInputElement,
): Promise<void> {
  daemon.clearText();
  daemon.injectTextAfterTimeout(textInput.value);
}

async function colorize(
  daemon: ColorizingDaemon,
  textInput: HTMLInputElement,
  text: string,
): Promise<void> {
  textInput.value = text;
  await daemon.injectTextNow(text);
}

export function ColorBox(
  props: { colorizer: Colorizer, text?: string, delayInMs?: number }
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
    return new ColorizingDaemon(
      setContent,
      props.colorizer,
      props.delayInMs ?? DEFAULT_DELAY_IN_MS);
  }, [props.colorizer]);

  useEffect(() => {
    if (props.text !== undefined && formulaRefObj.current) {
      colorize(daemon, formulaRefObj.current, props.text);
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
        onInput={e => blacken(daemon, e.target as HTMLInputElement)}
        onClick={e => blacken(daemon, e.target as HTMLInputElement)}
        onKeyDown={e => blacken(daemon, e.target as HTMLInputElement)}
        onKeyUp={e => blacken(daemon, e.target as HTMLInputElement)} />
    </div>);
}
