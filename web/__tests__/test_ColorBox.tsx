import { ColorBox, ColoredSpan, Colorizer } from '../app/components/ColorBox';
import { test, expect } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

class MockColorizer {
    public readonly colorizer: Colorizer;
    public text: string;
    public spans: ReadonlyArray<ColoredSpan>;
    public step: number;

    public constructor() {
        this.text = "";
        this.spans = [];
        this.colorizer = (text: string) => this._colorize(text);
        this.step = 0;
    }

    private _colorize(text: string): ReadonlyArray<ColoredSpan> {
        const parts = text.split(/(?=[ ])|(?<=[ ])/g);
        const spans: ColoredSpan[] = [];
        let ok = false;
        for (const part of parts) {
            if (part === " ") {
                spans.push({ textWidth: 1 });
            } else {
                if (ok) {
                    spans.push({ textWidth: part.length, color: "blue" });
                } else {
                    spans.push({ textWidth: part.length, color: "red" });
                }
                ok = !ok;
            }
        }
        this.text = text;
        this.spans = spans;
        this.step += 1;
        return spans;
    }
}

// The parent component owns the text and passes it down (controlled input).
function ControlledColorBox(props: { colorizer: Colorizer, initial?: string }): JSX.Element {
    const [value, setValue] = useState(props.initial ?? "");
    return <ColorBox colorizer={props.colorizer} value={value} onChange={setValue} />;
}

test('ColorBox calls the colorizer when the user provides input text', async () => {
    const user = userEvent.setup();
    const col = new MockColorizer();

    render(<ControlledColorBox colorizer={col.colorizer} />);

    expect(col.text).toBe("");
    expect(col.spans).toEqual([]);

    const input = screen.getByRole('textbox');
    await user.type(input, 'ab cd ef ghi');
    // Coloring is deferred until the field loses focus.
    fireEvent.blur(input);

    expect(col.text).toBe("ab cd ef ghi");
    expect(col.spans).toEqual(
    [
        { "color": "red", "textWidth": 2, },
        { "textWidth": 1, },
        { "color": "blue", "textWidth": 2, },
        { "textWidth": 1, },
        { "color": "red", "textWidth": 2, },
        { "textWidth": 1, },
        { "color": "blue", "textWidth": 3, },
    ]);
});

test('ColorBox adds colors to input text for the user', async () => {
    const user = userEvent.setup();
    const col = new MockColorizer();

    render(<ControlledColorBox colorizer={col.colorizer} />);

    const input = screen.getByRole('textbox');
    const box = screen.getByRole('formula');

    let children = Array.from(box.childNodes);
    expect(children.map(n => n.nodeType)).toEqual([Node.TEXT_NODE]);

    await user.type(input, 'ab cd ef ghi');
    // Coloring is deferred until the field loses focus.
    fireEvent.blur(input);

    children = Array.from(box.childNodes);
    expect(children.map(n => [n.nodeType, n.nodeName, n.textContent])).toEqual(
    [
        [Node.ELEMENT_NODE, "SPAN", "ab"],
        [Node.TEXT_NODE, "#text", "\xa0"],
        [Node.ELEMENT_NODE, "SPAN", "cd"],
        [Node.TEXT_NODE, "#text", "\xa0"],
        [Node.ELEMENT_NODE, "SPAN", "ef"],
        [Node.TEXT_NODE, "#text", "\xa0"],
        [Node.ELEMENT_NODE, "SPAN", "ghi"],
        [Node.TEXT_NODE, "#text", "\xa0"],
    ]);
});

test('ColorBox calls the colorizer when the text is provided in props', () => {
    const col = new MockColorizer();

    const { rerender } = render(<ColorBox
        colorizer={col.colorizer}
        value={"bing or bong"}
        onChange={() => {}} />
    );

    expect(col.text).toBe("bing or bong");
    expect(col.spans).toEqual(
    [
        { "color": "red", "textWidth": 4, },
        { "textWidth": 1, },
        { "color": "blue", "textWidth": 2, },
        { "textWidth": 1, },
        { "color": "red", "textWidth": 4, },
    ]);

    rerender(<ColorBox
        colorizer={col.colorizer}
        value={"boom"}
        onChange={() => {}} />
    );

    expect(col.text).toBe("boom");
    expect(col.spans).toEqual([ { "color": "red", "textWidth": 4, } ]);
});