import { Future } from '@/app/tools/Future';
import { ColorBox, ColoredSpan, Colorizer } from '../app/components/ColorBox';
import { test, expect } from '@jest/globals';
import { screen, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const DELAY_IN_MS = 20;

class MockColorizer {
    public readonly colorizer: Colorizer;
    public text: string;
    public spans: ReadonlyArray<ColoredSpan>;
    public onColorized: undefined | (() => void);

    public constructor() {
        this.text = "";
        this.spans = [];
        this.onColorized = undefined;
        this.colorizer = (text: string) => this._colorize(text);
    }

    private async _colorize(
        text: string,
    ): Promise<ReadonlyArray<ColoredSpan>> {
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
        await Promise.resolve();
        if (this.onColorized) {
            this.onColorized();
            this.onColorized = undefined;
        }
        return spans;
    }
}

test('Check the input text generates color spans', async () => {
    const user = userEvent.setup();
    const col = new MockColorizer();

    const { resolve, promise } = Future.createResolver<void>();
    col.onColorized = resolve;

    render(<ColorBox colorizer={col.colorizer} delayInMs={DELAY_IN_MS} />);

    expect(col.text).toBe("");
    expect(col.spans).toEqual([]);

    const input = screen.getByRole('textbox');

    await act(async () => {
        await user.type(input, 'ab cd ef ghi');
        await promise;
    });

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

test('Check the input text is colored for the user', async () => {
    const user = userEvent.setup();
    const col = new MockColorizer();

    const { resolve, promise } = Future.createResolver<void>();
    col.onColorized = resolve;

    render(<ColorBox colorizer={col.colorizer} delayInMs={DELAY_IN_MS} />);

    const input = screen.getByRole('textbox');
    const box = screen.getByRole('formula');

    let children = Array.from(box.childNodes);
    expect(children.map(n => n.nodeType)).toEqual([Node.TEXT_NODE]);

    await act(async () => {
        await user.type(input, 'ab cd ef ghi');
        await promise;
    });
    
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

test('Check prop text is taken into account', async () => {
    const col = new MockColorizer();

    const { resolve, promise } = Future.createResolver<void>();
    col.onColorized = resolve;

    const { rerender } = render(<ColorBox
        colorizer={col.colorizer}
        text={"bing or bong"}
        delayInMs={DELAY_IN_MS} />
    );

    await act(() => promise);

    expect(col.text).toBe("bing or bong");
    expect(col.spans).toEqual(
    [
        { "color": "red", "textWidth": 4, },
        { "textWidth": 1, },
        { "color": "blue", "textWidth": 2, },
        { "textWidth": 1, },
        { "color": "red", "textWidth": 4, },
    ]);

    const { resolve: resolve2, promise: promise2 } = Future.createResolver<void>();
    col.onColorized = resolve2;

    rerender(<ColorBox
        colorizer={col.colorizer}
        text={"boom"}
        delayInMs={DELAY_IN_MS} />
    );
    
    await act(() => promise2);
    
    expect(col.text).toBe("boom");
    expect(col.spans).toEqual([ { "color": "red", "textWidth": 4, } ]);
});