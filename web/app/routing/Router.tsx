import styles from './Router.module.css';
import { useEffect, useId, useState, } from "react";
import { Coordinator } from "./Coordinator";
import { RouterClient, URLStore, VisibilityProvider } from "./primitives";

export type PageInfo = {
    ctor: (client: RouterClient, visible: boolean) => JSX.Element,
    route: string,
};

function _createDefaultURLStore(): URLStore | undefined {
    if (typeof window === "undefined")
        return undefined;
    return {
        get searchParams(): URLSearchParams { 
            return new URLSearchParams(window.location.search);
        },
        set searchParams(params: URLSearchParams) {
            const path = params.size === 0 ?
                window.location.origin :
                `${window.location.origin}?${params.toString()}`;
            window.history.pushState({ path }, '', path);
        }
    };
}

const Wrapper = function(
    props: {
        client: RouterClient & VisibilityProvider,
        ctor: (client: RouterClient, visible: boolean) => JSX.Element,
    }
): JSX.Element {
    const [visible, setVisible] = useState(false);
    const client = props.client;
    const page: JSX.Element = props.ctor(client, visible);
    const style: React.CSSProperties = { visibility: visible ? "visible" : "hidden" };
    useEffect(() => { client.subscribe(setVisible); });
    return (
        <div id={client.wrapperId} className={styles.Wrapper} style={style}>
            {page}
        </div>
    );
}

type RouterKedgeData = {
    coordinator: Coordinator,
    wrappers: JSX.Element[],
};

class PrivateRouterKedge {
    private readonly _urlStoreGenerator: () => URLStore | undefined;
    private _data: RouterKedgeData | undefined;
    constructor(urlStoreGenerator?: () => URLStore) {
        this._data = undefined;
        this._urlStoreGenerator = urlStoreGenerator ?? _createDefaultURLStore;
    }
    init(globalId: string, pageInfos: ReadonlyArray<PageInfo>): RouterKedgeData {
        if (this._receivesSimilarData(globalId, pageInfos)) return this._data!;
        const routes = pageInfos.map(info => info.route);
        const coordinator = new Coordinator(this._urlStoreGenerator, globalId, routes);
        const wrappers = pageInfos.map((info, i) => {
            const client = coordinator.getClient(i);
            return (<Wrapper key={i} client={client} ctor={info.ctor} />);
        });
        return this._data = { coordinator, wrappers };
    }
    private _receivesSimilarData(
        globalId: string,
        pageInfos: ReadonlyArray<PageInfo>,
    ): boolean {
        if (this._data === undefined) return false;
        const { coordinator } = this._data;
        if (coordinator.globalId !== globalId) return false;
        const routes = coordinator.routes;
        return pageInfos.length === routes.length &&
            pageInfos.every((info, i) => routes[i] === info.route);
    }
};

export class RouterKedge {
    private readonly _kedge: PrivateRouterKedge;
    constructor(urlStoreGenerator?: () => URLStore) {
        this._kedge = new PrivateRouterKedge(urlStoreGenerator);
    }
};

export function Router(
    props: {
        kedge: RouterKedge,
        children: ReadonlyArray<PageInfo>,
    }
): JSX.Element {
    const globalId = useId();
    const kedge = props.kedge['_kedge'];
    const { coordinator, wrappers } = kedge.init(globalId, props.children);
    useEffect(() => coordinator.goToDefault(), []);
    return (<div className={styles.Router}>{wrappers}</div>);
}
