export {};

/* eslint @typescript-eslint/no-unsafe-member-access: "off" */

declare global {
    interface Set<T> {
        same(other: ReadonlySet<T>): boolean;
        setContentOf(target: Set<T>): void;
    }
}

(Set.prototype as any).same = function (this: ReadonlySet<any>, other: ReadonlySet<any>): boolean {
    return this.size === other.size && Array.from(this).every(v => other.has(v));
};

(Set.prototype as any).setContentOf = function (this: ReadonlySet<any>, target: Set<any>): void {
    target.clear();
    Array.from(this).forEach(v => target.add(v));
};