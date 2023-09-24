"use client";
import React, { memo } from 'react';
import styles from './ColorBox.module.css';

export type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export type Colorizer = (text: string) => Promise<ReadonlyArray<ColoredSpan>>;

class ColorizingDaemon {
  private readonly _textInput: HTMLInputElement;
  private readonly _setContent: (arg: JSX.Element) => void;
  private readonly _colorizer: Colorizer;
  private _version: number;

  constructor(
    textInput: HTMLInputElement,
    setContent: (arg: JSX.Element) => void,
    colorizer: Colorizer,
  ) {
    this._setContent = setContent;
    this._textInput = textInput;
    this._colorizer = colorizer;
    this._version = 0;
  }

  public inform() {
    ++this._version;
    const currentVersion = this._version;
    this._textInput.style.color = "black";
    this._setContent(<></>);
    setTimeout(() => this._analyze(currentVersion), 1000);
  }

  private async _analyze(candidateVersion: number) : Promise<void> {
    if (this._version !== candidateVersion) return;
    this._textInput.style.color = "black";
    this._setContent(<>{"\u00A0"}</>);
    const text = this._textInput.value;
    const spans = await this._colorizer(text);
    if (this._version !== candidateVersion) return;
    let offset = 0;
    const children: Array<JSX.Element> = [];
    for(const span of spans) {
      if (span.textWidth <= 0) continue;
      const nextOffset = Math.min(offset + span.textWidth, text.length);
      if (offset >= nextOffset) break;
      const subText = ColorizingDaemon._extractSubText(text, offset, nextOffset);
      const properties = Object.getOwnPropertyNames(span);
      if (properties.length === 1 && properties[0] === "textWidth") {
        children.push(<>{subText}</>);
      } else {
        children.push(<span style={span}>{subText}</span>);
      }
      offset = nextOffset;
    }
    if (offset < text.length) {
      children.push(<>{ColorizingDaemon._extractSubText(text, offset)}</>);
    }
    children.push(<>{"\u00A0"}</>);
    this._textInput.style.color = "transparent";
    this._setContent(<>{children}</>);
  }

  private static _extractSubText(text: string, from: number, to: number | null = null): string {
    return text.substring(from, to ?? text.length).replace(/ /g, "\u00A0");
  }
}

export const ColorBox = memo(function(props: { colorizer: Colorizer }) : JSX.Element {
  const formulaRefKey = React.useRef<HTMLInputElement>(null);
  const backdropRefKey = React.useRef<HTMLDivElement>(null);
  const [content, setContent] = React.useState(<>{"\u00A0"}</>);

  React.useEffect(() => {
    const textInput = formulaRefKey.current;
    const backdrop = backdropRefKey.current;
    if (backdrop != null && textInput != null)
      backdrop.scrollLeft = textInput.scrollLeft;
  });

  React.useEffect(() => {
    const textInput = formulaRefKey.current!;
    const backdrop = backdropRefKey.current!;
    const daemon = new ColorizingDaemon(textInput, setContent, props.colorizer);
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

  return (
    <div className={styles.BoxContainer}>
      <div className={styles.BoxBackdrop} ref={backdropRefKey}>
        <span className={styles.BoxFormula}>{content}</span>
      </div>
      <input type='text' className={styles.BoxText} ref={formulaRefKey}/>
    </div>);
});
