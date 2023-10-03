
export namespace Future {
    export async function sleep(milliseconds: number): Promise<void> {
        await new Promise(resolve => {
            return setTimeout(resolve, milliseconds)
        });
    };

    export type Resolver<T> = {
        readonly resolve: (value: T) => void,
        readonly promise: Promise<T>,
    };
    
    export function createResolver<T>(): Resolver<T> {
        const sourceRef = { resolve: null as any };
        const promise = new Promise<T>(resolve => { sourceRef.resolve = resolve; });
        return { resolve: sourceRef.resolve, promise };
    };
}