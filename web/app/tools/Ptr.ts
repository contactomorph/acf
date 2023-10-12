
export default class Ptr<T> {
    private _value: T | null;
    constructor() { this._value = null };
    public get value(): T | null { return this._value }
    public set(value: T): void { this._value = value; }
}