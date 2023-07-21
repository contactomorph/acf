export type PageNumber = {
    readonly globalId: string,
    readonly index: number,
};

export function toWrapperId(n: PageNumber): string {
    return `router_wrapper_${n.globalId}_${n.index}`;
}

export interface RouterClient {
    get route(): string;
    get routes(): ReadonlyArray<string>;
    goTo(route: string): void;
}