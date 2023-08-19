
export function same<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
    return a.size === b.size && Array.from(a).every(v => b.has(v));
}

export function setContent<T>(a: Set<T>, b: ReadonlySet<T>): void {
    a.clear();
    Array.from(b).every(v => a.add(v));
}