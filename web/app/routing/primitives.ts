export interface RouterClient {
    get index(): number;
    get route(): string;
    get wrapperId(): string;
    get routes(): ReadonlyArray<string>;
    goTo(route: string): void;
}