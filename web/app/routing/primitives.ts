export interface UriParams {
    readonly [key: string]: string | undefined;
};

export interface RouterClient {
    get route(): string;
    get wrapperId(): string;
    get routes(): ReadonlyArray<string>;
    getUriParam(key: string): string | undefined;
    setUriParam(key: string, value: string | undefined): void;
    goTo(route: string, uriParams: UriParams): boolean;
    goToUntouched(route: string): boolean;
}

export interface VisibilityProvider {
    subscribe(setState: (visible: boolean, touched: boolean) => void): void;
};

export interface URLStore {
    get searchParams(): URLSearchParams;
    set searchParams(params: URLSearchParams);
};