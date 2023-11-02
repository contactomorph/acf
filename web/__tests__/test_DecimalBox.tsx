import userEvent from '@testing-library/user-event';
import { DecimalBox } from '../app/components/DecimalBox';
import { test, expect } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';
import Ptr from '../app/tools/Ptr';

test('DecimalBox notifies appropriate value when clicking buttons and providing input', async () => {
    const user = userEvent.setup();

    const ptr = new Ptr<number>();

    render(<DecimalBox
        value={12.18}
        maxValue={20}
        minValue={3}
        decimalCount={2}
        onValueChange={value => ptr.set(value)} />
    );
        
    expect(ptr.value).toBe(12.18);

    const minusButton = screen.getByRole('minus');
    const plusButton = screen.getByRole('plus');
    const input = screen.getByRole('decimal_text');

    await user.click(minusButton);
    
    expect(ptr.value).toBe(12.17);

    await user.click(plusButton);
    await user.click(plusButton);
    
    expect(ptr.value).toBe(12.19);

    await user.click(plusButton);
    
    expect(ptr.value).toBe(12.2);

    await user.clear(input);
    await user.type(input, "19.99");
    const blurred = fireEvent.focusOut(input);
    
    expect(blurred).toBe(true);
    expect(ptr.value).toBe(19.99);
    
    await user.click(plusButton);
    expect(ptr.value).toBe(20);

    await user.click(plusButton);
    expect(ptr.value).toBe(20);

    await user.clear(input);
    await user.type(input, "2");
    fireEvent.focusOut(input);
    expect(ptr.value).toBe(3);
});


test('DecimalBox notifies appropriate value when changing props', async () => {
    const valueRef = { value: null as number | null };

    const { rerender } = render(<DecimalBox
        value={12.1239}
        maxValue={20}
        minValue={3}
        decimalCount={0}
        onValueChange={value => { valueRef.value = value }} />
    );
    
    expect(valueRef.value).toBe(12);
    
    rerender(<DecimalBox
        value={14}
        maxValue={20}
        minValue={3}
        decimalCount={0}
        onValueChange={value => { valueRef.value = value }} />
    );
        
    expect(valueRef.value).toBe(14);

    rerender(<DecimalBox
        value={14}
        maxValue={20}
        minValue={16.3}
        decimalCount={1}
        onValueChange={value => { valueRef.value = value }} />
    );
        
    expect(valueRef.value).toBe(16.3);

    rerender(<DecimalBox
        value={14}
        maxValue={10}
        minValue={16.3}
        decimalCount={0}
        onValueChange={value => { valueRef.value = value }} />
    );
        
    expect(valueRef.value).toBe(16);
});