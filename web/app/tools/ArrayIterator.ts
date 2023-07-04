
export class ArrayIterator<T> {
    private readonly _lexems: ReadonlyArray<T>;
    private _i: number;
    public constructor(lexems: ReadonlyArray<T>) {
        this._lexems = lexems;
        this._i = -1;
    }
    public get current(): T | undefined {
        if (this._i === -1 || this._i === this._lexems.length)
            return undefined;
        return this._lexems[this._i];
    }
    public get next(): T | undefined {
        if (this._i + 1 === this._lexems.length)
            return undefined;
        return this._lexems[this._i + 1];
    }
    public moveToNext(): T | undefined {
        if (this._i + 1 === this._lexems.length)
            return undefined;
        ++this._i;
        return this._lexems[this._i];
    }
}