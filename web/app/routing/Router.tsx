import styles from './Router.module.css';
import { memo, useEffect, useId, useState, } from "react";
import { Coordinator } from "./Coordinator";
import { RouterClient, VisibilityProvider } from "./primitives";

export type PageInfo = {
    ctor: (client: RouterClient, visible: boolean) => JSX.Element,
    route: string,
};

function getWindow(): Window | undefined {
    if (typeof window === "undefined")
        return undefined;
    return window;
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

export const Router = memo(function(
    props: { children: ReadonlyArray<PageInfo> }
): JSX.Element {
    const globalId = useId();
    const routes = props.children.map(info => info.route);
    const coordinator = new Coordinator(getWindow, globalId, routes);
    const wrappers = props.children.map((info, i) => {
        const client = coordinator.getClient(i);
        return (<Wrapper key={i} client={client} ctor={info.ctor} />);
    });
    useEffect(() => coordinator.goToDefault(), []);
    return (<div className={styles.Router}>{wrappers}</div>);
});
