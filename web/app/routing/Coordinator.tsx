"use client";

import { RouterClient, UriParams } from "./primitives";

const PAGE_URI_PARAMETER_NAME = "page";

type MutableUriParams = {
    [key: string]: string | undefined;
};

export class Coordinator {
    private readonly _globalId: string;
    private readonly _routes: ReadonlyArray<string>;
    private readonly _windowGenerator: () => Window | undefined;
    private _pageWrappers: ReadonlyArray<HTMLElement> | null;
    private _window: Window | undefined;
    private readonly _clients: Array<RouterClient | undefined>;

    constructor(
        windowGenerator: () => Window | undefined,
        globalId: string,
        routes: ReadonlyArray<string>,
    ) {
        this._globalId = globalId;
        this._routes = routes;
        this._windowGenerator = windowGenerator;
        this._pageWrappers = null;
        this._window = undefined;
        this._clients = Array(routes.length);
    }

    goToDefault() {
        const uriParams = this._copyUriParams();
        const route = uriParams[PAGE_URI_PARAMETER_NAME];
        const foundIndex = this._routes.findIndex(r => r === route);
        if (0 <= foundIndex) {
            this._goTo(foundIndex, uriParams);
        } else if (0 < this._routes.length) {
            this._goTo(0, uriParams);
        }
    }

    getClient(index: number): RouterClient {
        if (index < 0 || this._clients.length <= index)
            throw new Error("Invalid client index");
        let client = this._clients[index];
        if (client !== undefined)
            return client;
        const route = this._routes[index];
        return this._clients[index] = new Coordinator.PrivateClient(this, route, index);
    }

    _initWindow(): Window | undefined {
        if (this._window) return this._window;
        return this._window = this._windowGenerator();
    }

    private _goTo(index: number, uriParams: UriParams): void {
        const w = this._initWindow();
        if (w === undefined) return;
        if (index < 0 || this._clients.length <= index)
            return;
        const wrappers = this._getPageWrappers();
        wrappers.forEach((wrapper, i) => {
            wrapper.style.visibility = i === index ? "visible" : "hidden";
        });
        this._changeUriParams(this._routes[index], uriParams);
    }

    private _copyUriParams(): MutableUriParams {
        const w = this._initWindow();
        if (w === undefined) return {};
        const searchParams = new URLSearchParams(w.location.search);
        const uriParams: MutableUriParams = {};
        searchParams.forEach((value, key) => uriParams[key] = value);
        return uriParams;
    }

    private _changeUriParams(route: string, uriParams: UriParams): void {
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

    private _getPageWrappers(): ReadonlyArray<HTMLElement> {
        if (this._pageWrappers !== null)
            return this._pageWrappers;
        const pageWrappers: HTMLElement[] = [];
        for (let i = 0; i < this._routes.length; ++i) {
            const wrapperId = this._createWrapperId(i);
            const wrapper = this._window!.document.getElementById(wrapperId);
            if (wrapper === null) {
                throw new Error("Missing HTML page wrapper");
            }
            pageWrappers.push(wrapper);
        }
        this._pageWrappers = pageWrappers;
        return pageWrappers;
    }

    private _createWrapperId(n: number): string {
        return `router_wrapper_${this._globalId}_${n}`;
    }
    
    static PrivateClient = class implements RouterClient {
        private readonly _coordinator: Coordinator;
        private readonly _route: string;
        private readonly _index: number;

        constructor(coordinator: Coordinator, route: string, index: number) {
            this._coordinator = coordinator;
            this._route = route;
            this._index = index;
        }

        get index(): number {
            return this._index;
        }
        get route(): string {
            return this._route;
        }
        get wrapperId(): string {
            return this._coordinator._createWrapperId(this._index);
        }
        get routes(): ReadonlyArray<string> {
            return this._coordinator._routes;
        }
        getUriParam(key: string): string | undefined {
            const uriParams = this._coordinator._copyUriParams();
            return uriParams[key];
        }
        setUriParam(key: string, value: string | undefined): void {
            const newUriParams = this._coordinator._copyUriParams();
            if (value !== newUriParams[key]) {
                newUriParams[key] = value;
                this._coordinator._changeUriParams(this._route, newUriParams);
            }
        }
        goTo(route: string, uriParams: UriParams): void {
            if (route === this._route) { return; }
            const foundIndex = this._coordinator._routes.findIndex(r => r === route);
            if (0 <= foundIndex) {
                this._coordinator._goTo(foundIndex, uriParams);
            }
        }
    }
}