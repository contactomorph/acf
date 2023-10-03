

export default class DiscreteRange {
    private readonly _decimalCount: number;
    private readonly _factor: number;
    private readonly _minValue: number;
    private readonly _maxValue: number;

    get step(): number { return 1.0 / this._factor; }

    constructor(
        expectedDecimalCount: number | undefined,
        expectedMinValue: number | undefined,
        expectedMaxValue: number | undefined,
    ) {
        this._decimalCount = 0;
        if (expectedDecimalCount !== undefined && 0 < expectedDecimalCount) {
            this._decimalCount = Math.round(expectedDecimalCount);
        }
        this._factor = Math.pow(10, this._decimalCount);
        this._minValue = expectedMinValue ?? 0;
        this._maxValue = Math.max(this._minValue, expectedMaxValue ?? 100);
    }
    
    clamp(x: number): number {
        if (!Number.isFinite(x)) {
            return this._minValue;
        }
        const y = Math.min(Math.max(x, this._minValue), this._maxValue);
        return Math.round(y * this._factor) / this._factor;
    }

    toFixed(x: number): string {
        return x.toFixed(this._decimalCount);
    }
};