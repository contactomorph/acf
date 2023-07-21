"use client";

import { PageNumber, RouterClient, toWrapperId } from "./primitives";

export function RouterCore(props: {
    globalId: string,
    routes: ReadonlyArray<string>,
}): JSX.Element {
    attachCoordinator(props.globalId, () => new Coordinator(props.globalId, props.routes));
    return (<></>);
}

export function getClient(n: PageNumber): RouterClient | undefined {
    const coordinator = retrieveCoordinator(n.globalId);
    return coordinator?.getClient(n.index);
}

class Coordinator {
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
            const n: PageNumber = {
                globalId: this._globalId,
                index: i,
            };
            const wrapperId = toWrapperId(n);
            const wrapper = document.getElementById(wrapperId);
            if (wrapper === null) {
                throw new Error();
            }
            wrappers.push(wrapper);
        }
        this._wrappers = wrappers;
        return wrappers;
    }
}

function toCoordinatorId(globalId: string) {
    return "router_coordinator_" + globalId;
}

function attachCoordinator(globalId: string, generator: () => Coordinator) {
    if (typeof document !== "undefined") {
        const coordinator = generator();
        (document as any)[toCoordinatorId(globalId)] = coordinator;
    }
}

function retrieveCoordinator(globalId: string) : Coordinator | undefined {
    if (typeof document === "undefined") {
        return undefined;
    }
    const value = (document as any)[toCoordinatorId(globalId)];
    if (typeof value !== "object") {
        throw new Error();
    }
    return value as Coordinator;
}
