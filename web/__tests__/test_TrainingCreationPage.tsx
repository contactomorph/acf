import TrainingCreationPage from '../app/TrainingCreationPage';
import { RouterClient, UriParams } from '../app/routing/primitives';
import { test, expect } from '@jest/globals';
import { render, waitFor, within } from '@testing-library/react';
import Model from '../app/model/Model';
import FirebaseHistoryRepository from '../app/backend/MockHistoryRepository';

/* eslint-disable @typescript-eslint/class-literal-property-style */

// Rows rendered by the `Program` table body: each one is a training step.
// (identity-obj-proxy maps the CSS module class name to itself in tests.)
function getProgramStepRows(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.ProgTable tbody tr'));
}

function normalize(text: string | null): string {
    return (text ?? "").replace(/\u00A0/g, ' ');
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
    goToUntouched(_route: string): boolean { return false; }
}

test('TrainingCreationPage propage url and display program when becoming visible', async () => {
    const client = new MockRouterClient({});
    const model = new Model(new FirebaseHistoryRepository());

    const { rerender } = render(
        <TrainingCreationPage client={client} model={model} visible={false} touched={false} />
    );

    expect(client.step).toBe(0);

    expect(getProgramStepRows()).toEqual([]);

    client.currentUriParams = {
        "speed": "13.2",
        "id": "CEE9E48C-825C-4FDF-B617-F6D4E08ECE0D",
    };

    rerender(
        <TrainingCreationPage client={client} model={model} visible={true} touched={true} />
    );

    expect(client.step).toBe(1);

    expect(client.currentUriParams).toEqual({
        "speed": "13.2",
        "id": "CEE9E48C-825C-4FDF-B617-F6D4E08ECE0D",
    });

    let stepRows: HTMLElement[] = [];
    await waitFor(() => {
        stepRows = getProgramStepRows();
        expect(stepRows.length).toBe(31);
    }, { timeout: 2000 });

    // The formula is made of two identical 4-round blocks: the first
    // step of each round displays a "round index / round count" label.
    const roundLabels = stepRows
        .map(row => within(row).queryAllByRole('cell')[0])
        .filter((cell): cell is HTMLElement => cell !== null)
        .map(cell => normalize(cell.textContent))
        .filter(text => /^\d+ \/ \d+$/.test(text));

    expect(roundLabels).toEqual([
        '1 / 4', '2 / 4', '3 / 4', '4 / 4',
        '1 / 4', '2 / 4', '3 / 4', '4 / 4',
    ]);

    // Recovery and effort steps are both present, with the expected titles.
    const titles = stepRows.map(row => row.querySelector('td[title]')?.getAttribute('title'));
    expect(titles).toContain('Course');
    expect(titles).toContain('Récupération');
});