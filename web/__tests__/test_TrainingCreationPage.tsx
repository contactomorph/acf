import TrainingCreationPage from '@/app/TrainingCreationPage';
import { RouterClient, UriParams } from '@/app/routing/primitives';
import { test, expect } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const NBSP = "\u00A0";

class MockRouterClient implements RouterClient {
    currentUriParams: UriParams;
    step: number;
    constructor(uriParams: UriParams) {
        this.currentUriParams = uriParams;
        this.step = 0;
    }
    get route(): string { return "mockPage"; }
    get wrapperId(): string { return ""; }
    get routes(): readonly string[] { return [this.route]; }
    getUriParam(key: string): string | undefined { return this.currentUriParams[key]; }
    setUriParam(key: string, value: string | undefined): void {
        (this.currentUriParams as any)[key] = value;
        this.step += 1;
    }
    goTo(_route: string, _uriParams: UriParams): boolean { return false; }
}

test('TrainingCreationPage updates url and display program when user provides text', async () => {
    const client = new MockRouterClient({});
    const user = userEvent.setup();

    render(<TrainingCreationPage client={client} visible={true} />);

    expect(client.step).toBe(2);
    expect(client.currentUriParams).toEqual({});

    let runningBlocks = screen.queryAllByRole('running_block');
    expect(runningBlocks).toEqual([]);
    
    const colorBoxInput = screen.getByRole<HTMLInputElement>('textbox');
    
    await user.type(colorBoxInput, '2min a vma');
    const blurred = fireEvent.focusOut(colorBoxInput);
    
    expect(blurred).toBe(true);
    expect(client.step).toBe(3)

    expect(client.currentUriParams).toEqual({
        "formula": "2min a vma",
        "speed": undefined,
    });

    runningBlocks = screen.queryAllByRole('running_block');
    expect(runningBlocks.length).not.toBe(0);

    runningBlocks = screen.getAllByRole('running_block');
    
    const blockInfo = runningBlocks.map(b => {
        const parts = b.title.split('\n').map(i => i.trim());
        return [
            b.style.width,
            b.style.backgroundColor,
            parts[1],
            parts[2],
        ];
    });

    expect(blockInfo).toEqual([
        ["100%", "rgb(211, 53, 29)", `500${NBSP}m`, `→${NBSP}500${NBSP}m`, ],
        ["100%", "rgb(211, 53, 29)", `2${NBSP}min`, `→${NBSP}2${NBSP}min`, ],
    ]);
});