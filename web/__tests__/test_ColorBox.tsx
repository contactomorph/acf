import { Future } from '@/app/tools/Future';
import { ColorBox, ColoredSpan } from '../app/components/ColorBox';
import { test, expect } from '@jest/globals';
import { screen, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

class MockColorizer {
    public text: string;
    public spans: ReadonlyArray<ColoredSpan>;

    public constructor() {
        this.text = "";
        this.spans = [];
    }

    public async colorizeAndCall(
        text: string,
        action: () => void,
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
        action();
        return spans;
    }
}

test('Check the input text generates color spans', async () => {
    const col = new MockColorizer();
    const { resolve, promise } = Future.createResolver<void>();
    const user = userEvent.setup();

    render(<ColorBox colorizer={t => col.colorizeAndCall(t, resolve)} />);

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
    const col = new MockColorizer();
    const { resolve, promise } = Future.createResolver<void>();
    const user = userEvent.setup();

    render(<ColorBox colorizer={t => col.colorizeAndCall(t, resolve)} />);

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