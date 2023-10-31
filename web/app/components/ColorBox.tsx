"use client";
import React, { useEffect, useRef, useState } from 'react';
import styles from './ColorBox.module.css';

export type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export type Colorizer = (text: string) => Promise<ReadonlyArray<ColoredSpan>>;

const NBSP = "\u00A0";
const DEFAULT_DELAY_IN_MS = 1000;
const EMPTY_CONTENT: JSX.Element = (<>{NBSP}</>);

class ColorizingDaemon {
  private readonly _textInput: HTMLInputElement;
  private readonly _setContent: (arg: JSX.Element) => void;
  private readonly _colorizer: Colorizer;
  private _version: number;
  public delayInMs: number;

  constructor(
    textInput: HTMLInputElement,
    setContent: (arg: JSX.Element) => void,
    colorizer: Colorizer,
    delayInMs: number,
  ) {
    this._setContent = setContent;
    this._textInput = textInput;
    this._colorizer = colorizer;
    this.delayInMs = delayInMs;
    this._version = 0;
  }

  public inform() {
    ++this._version;
    const currentVersion = this._version;
    this._textInput.style.color = "black";
    this._setContent(EMPTY_CONTENT);
    setTimeout(() => this._analyze(currentVersion), this.delayInMs);
  }

  public async analyzeNow(text: string): Promise<void> {
    ++this._version;
    const candidateVersion = this._version;
    this._textInput.style.color = "transparent";
    this._textInput.value = text;
    const spans = await this._colorizer(text);
    if (this._version !== candidateVersion) return;
    const children = ColorizingDaemon._createChildren(spans, text);
    this._textInput.style.color = "transparent";
    this._setContent(<>{children}</>);
  }

  private async _analyze(candidateVersion: number): Promise<void> {
    if (this._version !== candidateVersion) return;
    this._textInput.style.color = "black";
    this._setContent(EMPTY_CONTENT);
    const text = this._textInput.value;
    const spans = await this._colorizer(text);
    if (this._version !== candidateVersion) return;
    const children = ColorizingDaemon._createChildren(spans, text);
    this._textInput.style.color = "transparent";
    this._setContent(<>{children}</>);
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

export function ColorBox(
  props: { colorizer: Colorizer, text?: string, delayInMs?: number }
) : JSX.Element {
  const formulaRefObj = useRef<HTMLInputElement>(null);
  const backdropRefObj = useRef<HTMLDivElement>(null);
  const daemonRefObj = useRef<ColorizingDaemon|null>(null);
  const [content, setContent] = useState(EMPTY_CONTENT);

  useEffect(() => {
    const textInput = formulaRefObj.current;
    const backdrop = backdropRefObj.current;
    if (backdrop !== null && textInput !== null) {
      backdrop.scrollLeft = textInput.scrollLeft;
    }
  });

  useEffect(() => {
    const textInput = formulaRefObj.current!;
    const backdrop = backdropRefObj.current!;
    const daemon = new ColorizingDaemon(
      textInput,
      setContent,
      props.colorizer,
      props.delayInMs ?? DEFAULT_DELAY_IN_MS);
    daemonRefObj.current = daemon;
    function colorize() { daemon.inform(); }
    function scroll() { backdrop.scrollLeft = textInput.scrollLeft; }
    textInput.addEventListener("scroll", scroll);
    textInput.addEventListener("input", colorize);
    textInput.addEventListener("keydown", colorize);
    textInput.addEventListener("keyup", colorize);
    textInput.addEventListener("click", colorize);
    return () => {
      textInput.removeEventListener("scroll", scroll);
      textInput.removeEventListener("input", colorize);
      textInput.removeEventListener("keydown", colorize);
      textInput.removeEventListener("keyup", colorize);
      textInput.removeEventListener("click", colorize);
    };
  }, [props.colorizer]);

  useEffect(() => {
    daemonRefObj.current!.delayInMs = props.delayInMs ?? DEFAULT_DELAY_IN_MS;
  }, [props.delayInMs])

  useEffect(() => {
    if (props.text !== undefined) {
      daemonRefObj.current!.analyzeNow(props.text);
    }
  }, [props.colorizer, props.text]);

  return (
    <div className={styles.BoxContainer}>
      <div className={styles.BoxBackdrop} ref={backdropRefObj}>
        <span className={styles.BoxFormula} role='formula'>{content}</span>
      </div>
      <input type='text' className={styles.BoxText} ref={formulaRefObj}/>
    </div>);
}
