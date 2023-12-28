
export namespace Future {
    export function sleep(milliseconds: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
    };
    export function pause(): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, 1));
    };

    export interface Resolver<T> {
        readonly resolve: (value: T) => void,
        readonly promise: Promise<T>,
    };
    
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */

    export function createResolver<T>(): Resolver<T> {
        const sourceRef = { resolve: null as any };
        const promise = new Promise<T>(resolve => { sourceRef.resolve = resolve; });
        return { resolve: sourceRef.resolve, promise };
    };
    
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
}