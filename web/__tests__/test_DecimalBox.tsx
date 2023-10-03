import userEvent from '@testing-library/user-event';
import { DecimalBox } from '../app/components/DecimalBox';
import { test, expect } from '@jest/globals';
import { screen, render, fireEvent } from '@testing-library/react';

test('Check clicking the buttons and providing input has appropriate effect', async () => {
    const user = userEvent.setup();

    const valueRef = { value: null as number | null };

    render(<DecimalBox
        value={12.18}
        maxValue={20}
        minValue={3}
        decimalCount={2}
        onValueChange={value => { valueRef.value = value }} />
    );
        
    expect(valueRef.value).toBe(12.18);

    const minusButton = screen.getByRole('minus');
    const plusButton = screen.getByRole('plus');
    const input = screen.getByRole('decimal_text');

    await user.click(minusButton);
    
    expect(valueRef.value).toBe(12.17);

    await user.click(plusButton);
    await user.click(plusButton);
    
    expect(valueRef.value).toBe(12.19);

    await user.click(plusButton);
    
    expect(valueRef.value).toBe(12.2);

    await user.clear(input);
    await user.type(input, "19.99");
    const blurred = fireEvent.focusOut(input);
    
    expect(blurred).toBe(true);
    expect(valueRef.value).toBe(19.99);
    
    await user.click(plusButton);
    expect(valueRef.value).toBe(20);

    await user.click(plusButton);
    expect(valueRef.value).toBe(20);

    await user.clear(input);
    await user.type(input, "2");
    fireEvent.focusOut(input);
    expect(valueRef.value).toBe(3);
});


test('Check rerendering with new props', async () => {
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