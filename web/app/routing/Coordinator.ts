
import { RouterClient, UriParams, URLStore, VisibilityProvider } from "./primitives";

const PAGE_URI_PARAMETER_NAME = "page";

interface MutableUriParams {
    [key: string]: string | undefined;
};

class PrivateCoordinator {
    readonly globalId: string;
    readonly routes: ReadonlyArray<string>;
    readonly clients: ReadonlyArray<PrivateClient>;
    private _activeIndex: number;
    private readonly _urlStoreGenerator: () => URLStore | undefined;
    private _store: URLStore | undefined;

    constructor(
        urlStoreGenerator: () => URLStore | undefined,
        globalId: string,
        routes: ReadonlyArray<string>,
    ) {
        this.globalId = globalId;
        this.routes = routes;
        this.clients = routes.map((route, index) => new PrivateClient(this, route, index));
        this._activeIndex = -1;
        this._urlStoreGenerator = urlStoreGenerator;
        this._store = undefined;
    }

    private _initStore(): URLStore | undefined {
        if (this._store) return this._store;
        return this._store = this._urlStoreGenerator();
    }
    
    goTo(index: number, uriParams: UriParams): boolean {
        if (index < 0 || this.clients.length <= index || this._activeIndex === index)
            return false;
        this.clients.forEach((client, i) => {
            client.setVisible(i === index);
        });
        this._activeIndex = index;
        this.replaceUriParams(this.routes[index], uriParams);
        return true;
    }

    goToDefault() {
        const uriParams = this.copyUriParams();
        const route = uriParams[PAGE_URI_PARAMETER_NAME];
        const foundIndex = this.routes.findIndex(r => r === route);
        if (0 <= foundIndex) {
            this.goTo(foundIndex, uriParams);
        } else if (0 < this.clients.length) {
            this.goTo(0, uriParams);
        }
    }

    copyUriParams(): MutableUriParams {
        const h = this._initStore();
        if (h === undefined) return {};
        const uriParams: MutableUriParams = {};
        h.searchParams.forEach((value, key) => uriParams[key] = value);
        return uriParams;
    }

    replaceUriParams(route: string, uriParams: UriParams): void {
        const h = this._initStore();
        if (h === undefined) return;
        const searchParams = new URLSearchParams();
        searchParams.set(PAGE_URI_PARAMETER_NAME, route);
        for (const key in uriParams) {
            const value = uriParams[key];
            if (value != undefined)
                searchParams.set(key, value);
        }
        h.searchParams = searchParams;
    }

    createWrapperId(n: number): string {
        return `router_wrapper_${this.globalId}_${n}`;
    }
};

class PrivateClient implements RouterClient, VisibilityProvider {
    private readonly _coord: PrivateCoordinator;
    private readonly _route: string;
    private readonly _index: number;
    private _visible: boolean;
    private _setVisible: (visible: boolean) => void;

    constructor(coordinator: PrivateCoordinator, route: string, index: number) {
        this._coord = coordinator;
        this._route = route;
        this._index = index;
        this._visible = false;
        this._setVisible = () => {};
    }

    get route(): string {
        return this._route;
    }
    get wrapperId(): string {
        return this._coord.createWrapperId(this._index);
    }
    get routes(): ReadonlyArray<string> {
        return this._coord.routes;
    }
    getUriParam(key: string): string | undefined {
        const uriParams = this._coord.copyUriParams();
        return uriParams[key];
    }
    setUriParam(key: string, value: string | undefined): void {
        if (!this._visible) return;
        const newUriParams = this._coord.copyUriParams();
        if (value !== newUriParams[key]) {
            newUriParams[key] = value;
            this._coord.replaceUriParams(this._route, newUriParams);
        }
    }
    goTo(route: string, uriParams: UriParams): boolean {
        if (!this._visible) return false;
        const foundIndex = this._coord.routes.findIndex(r => r === route);
        if (0 <= foundIndex) {
            return this._coord.goTo(foundIndex, uriParams);
        }
        return false;
    }
    setVisible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this._setVisible(visible);
        }
    }
    subscribe(setVisible: (visible: boolean) => void): void {
        this._setVisible = setVisible;
    }
}

export class Coordinator {
    private readonly _coord: PrivateCoordinator;

    constructor(
        urlStoreGenerator: () => URLStore | undefined,
        globalId: string,
        routes: ReadonlyArray<string>,
    ) {
        this._coord = new PrivateCoordinator(urlStoreGenerator, globalId, routes);
    }

    public get globalId(): string { return this._coord.globalId; }
    public get routes(): ReadonlyArray<string> { return this._coord.routes; }

    public goToDefault() { this._coord.goToDefault(); }

    public getClient(index: number): RouterClient & VisibilityProvider {
        if (index < 0 || this._coord.clients.length <= index)
            throw new Error("Invalid client index");
        return this._coord.clients[index];
    }
}