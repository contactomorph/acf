"use client";

import { RouterClient } from "./RouterClient";

export class Coordinator {
    private readonly _globalId: string;
    private readonly _routes: ReadonlyArray<string>;
    private _wrappers: ReadonlyArray<HTMLElement> | null;
    private readonly _clients: Array<RouterClient | undefined>;

    constructor(globalId: string, routes: ReadonlyArray<string>) {
        this._globalId = globalId;
        this._routes = routes;
        this._wrappers = null;
        this._clients = Array(routes.length);
    }

    getClient(index: number): RouterClient {
        if (index < 0 || this._clients.length <= index)
            throw new Error();
        let client = this._clients[index];
        if (client !== undefined)
            return client;
        const currentRoute = this._routes[index];
        this._clients[index] = client = {
            index,
            wrapperId: this._createWrapperId(index),
            goTo: this._createGoTo(currentRoute),
            route: currentRoute,
            routes: this._routes,
        };
        return client;
    }

    private _createGoTo(currentRoute: string): (route: string) => void {
        return (route: string) => {
            if (route === currentRoute) { return; }
            const foundIndex = this._routes.findIndex(r => r === route);
            if (foundIndex < 0) { return; }
            const wrappers = this._getWrappers();
            wrappers.forEach((wrapper, i) => {
                wrapper.style.visibility = i === foundIndex ? "visible" : "hidden";
            });
        };
    }

    private _getWrappers(): ReadonlyArray<HTMLElement> {
        if (this._wrappers !== null)
            return this._wrappers;
        const wrappers: HTMLElement[] = [];
        for (let i = 0; i < this._routes.length; ++i) {
            const wrapperId = this._createWrapperId(i);
            const wrapper = document.getElementById(wrapperId);
            if (wrapper === null) {
                throw new Error();
            }
            wrappers.push(wrapper);
        }
        this._wrappers = wrappers;
        return wrappers;
    }

    private _createWrapperId(n: number): string {
        return `router_wrapper_${this._globalId}_${n}`;
    }
}
