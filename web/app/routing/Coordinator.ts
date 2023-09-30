"use client";

import { RouterClient, UriParams, VisibilityProvider } from "./primitives";

const PAGE_URI_PARAMETER_NAME = "page";

type MutableUriParams = {
    [key: string]: string | undefined;
};

class PrivateCoordinator {
    readonly globalId: string;
    readonly routes: ReadonlyArray<string>;
    readonly clients: ReadonlyArray<PrivateClient>;
    private readonly _windowGenerator: () => Window | undefined;
    private _window: Window | undefined;

    constructor(
        windowGenerator: () => Window | undefined,
        globalId: string,
        routes: ReadonlyArray<string>,
    ) {
        this.globalId = globalId;
        this.routes = routes;
        this.clients = routes.map((route, index) => new PrivateClient(this, route, index));
        this._windowGenerator = windowGenerator;
        this._window = undefined;
    }

    private _initWindow(): Window | undefined {
        if (this._window) return this._window;
        return this._window = this._windowGenerator();
    }
    
    goTo(index: number, uriParams: UriParams): void {
        if (index < 0 || this.clients.length <= index)
            return;
        this.clients.forEach((client, i) => {
            client.setVisible(i === index);
        });
        this.replaceUriParams(this.routes[index], uriParams);
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
        const w = this._initWindow();
        if (w === undefined) return {};
        const searchParams = new URLSearchParams(w.location.search);
        const uriParams: MutableUriParams = {};
        searchParams.forEach((value, key) => uriParams[key] = value);
        return uriParams;
    }

    replaceUriParams(route: string, uriParams: UriParams): void {
        const w = this._initWindow();
        if (w === undefined) return;
        const searchParams = new URLSearchParams();
        searchParams.set(PAGE_URI_PARAMETER_NAME, route);
        for (const key in uriParams) {
            const value = uriParams[key];
            if (value != undefined)
                searchParams.set(key, value);
        }
        const path = `${w.location.origin}?${searchParams.toString()}`;
        w.history.pushState({ path }, '', path);
    }

    createWrapperId(n: number): string {
        return `router_wrapper_${this.globalId}_${n}`;
    }
};

class PrivateClient implements RouterClient, VisibilityProvider {
    private readonly _coord: PrivateCoordinator;
    private readonly _route: string;
    private readonly _index: number;
    private _setVisible: (visible: boolean) => void;

    constructor(coordinator: PrivateCoordinator, route: string, index: number) {
        this._coord = coordinator;
        this._route = route;
        this._index = index;
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
        const newUriParams = this._coord.copyUriParams();
        if (value !== newUriParams[key]) {
            newUriParams[key] = value;
            this._coord.replaceUriParams(this._route, newUriParams);
        }
    }
    goTo(route: string, uriParams: UriParams): void {
        if (route === this._route) { return; }
        const foundIndex = this._coord.routes.findIndex(r => r === route);
        if (0 <= foundIndex) {
            this._coord.goTo(foundIndex, uriParams);
        }
    }
    setVisible(visible: boolean) {
        if (this._setVisible) {
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
        windowGenerator: () => Window | undefined,
        globalId: string,
        routes: ReadonlyArray<string>,
    ) {
        this._coord = new PrivateCoordinator(windowGenerator, globalId, routes);
    }

    public goToDefault() { this._coord.goToDefault(); }

    public getClient(index: number): RouterClient & VisibilityProvider {
        if (index < 0 || this._coord.clients.length <= index)
            throw new Error("Invalid client index");
        return this._coord.clients[index];
    }
}