import { test, expect } from '@jest/globals';
import { screen, render } from '@testing-library/react';
import { RunningBar, Block } from '@/app/components/RunningBar';
import chroma from 'chroma-js';

test('RunningBar renders propely', async () => {
    const blocks: Block[] = [
        { color: chroma("pink"), icon: "😊", texts: [], width: 100 },
        { color: chroma("orange"), icon: "😊", texts: [], width: 200 },
        { color: chroma("teal"), icon: "😊", texts: [], width: 500 },
    ];
    render(<RunningBar blocks={blocks} title='Hello' />);

    const runningBlocks = screen.getAllByRole('running_block');

    expect(runningBlocks.length).toBe(3);
    expect(runningBlocks[0].style.width).toBe("12.5%");
    expect(runningBlocks[1].style.width).toBe("25%");
    expect(runningBlocks[2].style.width).toBe("62.5%");
});
