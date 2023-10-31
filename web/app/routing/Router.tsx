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

export function Router(
    props: {
        children: ReadonlyArray<PageInfo>,
        urlStoreGenerator?: () => URLStore,
    }
): JSX.Element {
    const globalId = useId();
    const routes = props.children.map(info => info.route);
    const urlStoreGenerator = props.urlStoreGenerator ?? _createDefaultURLStore;
    const coordinator = new Coordinator(urlStoreGenerator, globalId, routes);
    const wrappers = props.children.map((info, i) => {
        const client = coordinator.getClient(i);
        return (<Wrapper key={i} client={client} ctor={info.ctor} />);
    });
    useEffect(() => coordinator.goToDefault(), []);
    return (<div className={styles.Router}>{wrappers}</div>);
}
