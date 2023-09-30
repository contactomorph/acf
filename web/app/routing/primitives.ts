export type UriParams = {
    readonly [key: string]: string | undefined;
};

export interface RouterClient {
    get route(): string;
    get wrapperId(): string;
    get routes(): ReadonlyArray<string>;
    getUriParam(key: string): string | undefined;
    setUriParam(key: string, value: string | undefined): void;
    goTo(route: string, uriParams: UriParams): void;
}

export interface VisibilityProvider {
    subscribe(setVisible: (visible: boolean) => void): void;
};