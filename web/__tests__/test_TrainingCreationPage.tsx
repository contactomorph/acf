import TrainingCreationPage from '../app/TrainingCreationPage';
import { RouterClient, UriParams } from '../app/routing/primitives';
import { test, expect } from '@jest/globals';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Model from '../app/model/Model';
import FirebaseHistoryRepository from '../app/backend/MockHistoryRepository';

// eslint-disable-next-line react-refresh/only-export-components
const NBSP = "\u00A0";

/* eslint-disable @typescript-eslint/class-literal-property-style */

function toBlockInfo(element: HTMLElement): string[] {
    const parts = element.title.split('\n').map(i => i.trim());
    return [
        element.style.width,
        element.style.backgroundColor,
        parts[1],
        parts[2],
    ];
}

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.currentUriParams as any)[key] = value;
        this.step += 1;
    }
    goTo(_route: string, _uriParams: UriParams): boolean { return false; }
}

test('TrainingCreationPage updates url and display program when user provides text', async () => {
    const client = new MockRouterClient({});
    const user = userEvent.setup();
    const model = new Model(new FirebaseHistoryRepository());

    render(<TrainingCreationPage client={client} model={model} visible={true} />);

    expect(client.step).toBe(1);
    expect(client.currentUriParams).toEqual({});

    let runningBlocks = screen.queryAllByRole('running_block');
    expect(runningBlocks).toEqual([]);
    
    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
    expect(inputs.length).toBe(3);
    
    const colorBoxInput = inputs[2];
    expect(colorBoxInput.value).toBe("");
    
    await user.type(colorBoxInput, '2min a vma');
    const blurred = fireEvent.focusOut(colorBoxInput);
    
    expect(blurred).toBe(true);
    expect(client.step).toBe(1)

    expect(client.currentUriParams).toEqual({ "speed": undefined, });

    runningBlocks = screen.queryAllByRole('running_block');
    expect(runningBlocks.length).not.toBe(0);

    runningBlocks = screen.getAllByRole('running_block');
    
    const blockInfo = runningBlocks.map(toBlockInfo);

    expect(blockInfo).toEqual([
        ["100%", "rgb(211, 53, 29)", `500${NBSP}m`, `→${NBSP}500${NBSP}m`, ],
        ["100%", "rgb(211, 53, 29)", `2${NBSP}min`, `→${NBSP}2${NBSP}min`, ],
    ]);
});

test('TrainingCreationPage propage url and display program when becoming visible', async () => {
    const client = new MockRouterClient({});
    const model = new Model(new FirebaseHistoryRepository());

    const { rerender } = render(
        <TrainingCreationPage client={client} model={model} visible={false} />
    );

    expect(client.step).toBe(0);

    let runningBlocks = screen.queryAllByRole('running_block');
    expect(runningBlocks).toEqual([]);

    client.currentUriParams = {
        "speed": "13.2",
        "id": "CEE9E48C-825C-4FDF-B617-F6D4E08ECE0D",
    };

    rerender(
        <TrainingCreationPage client={client} model={model} visible={true} />
    );

    expect(client.step).toBe(1);

    expect(client.currentUriParams).toEqual({
        "speed": "13.2",
        "id": "CEE9E48C-825C-4FDF-B617-F6D4E08ECE0D",
    });

    await waitFor(() => {
        runningBlocks = screen.queryAllByRole('running_block');
        expect(runningBlocks.length).toBe(62);
    }, { timeout: 2000 });
    
    const blockInfo = runningBlocks.slice(0, 3).map(toBlockInfo);

    expect(blockInfo).toEqual([
        ["3.4815910871268168%", "rgb(211, 53, 29)", `146${NBSP}m`, `→${NBSP}146${NBSP}m`, ],
        ["1.6450517886674207%", "rgb(173, 231, 159)", `69${NBSP}m`, `→${NBSP}215${NBSP}m`, ],
        ["4.700147967621203%", "rgb(239, 110, 46)", `198${NBSP}m`, `→${NBSP}413${NBSP}m`, ],
    ]);
});