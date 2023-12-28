import { test, expect } from '@jest/globals';
import { screen, render } from '@testing-library/react';
import { RunningBar, Block } from '../app/components/RunningBar';
import chroma from 'chroma-js';

test('RunningBar renders properly', () => {
    const blocks: Block[] = [
        { color: chroma("pink"), icon: "😊", texts: [], width: 100 },
        { color: chroma("orange"), icon: "😠", texts: [], width: 200 },
        { color: chroma("teal"), icon: "😭", texts: [], width: 500 },
    ];
    render(<RunningBar blocks={blocks} title='Hello' />);

    const runningBlocks = screen.getAllByRole('running_block');

    const blockInfo = runningBlocks.map(b =>
        [b.style.width, b.style.backgroundColor, b.title]);

    expect(blockInfo).toEqual([
        ["12.5%", "rgb(221, 204, 207)", "😊\n"],
        ["25%", "rgb(244, 169, 66)", "😠\n"],
        ["62.5%", "rgb(88, 121, 120)", "😭\n"],
    ]);
});
