import styles from './Router.module.css';
import { memo, useEffect, useId, useMemo, } from "react";
import { Coordinator } from "./Coordinator";
import { RouterClient } from "./primitives";

export type PageInfo = {
    ctor: (client: RouterClient) => JSX.Element,
    route: string,
};

function getWindow(): Window | undefined {
    if (typeof window === "undefined")
        return undefined;
    return window;
}

export const Router = memo(function(
    props: { children: ReadonlyArray<PageInfo> }
): JSX.Element {
    const globalId = useId();
    const coordinator = useMemo(() => {
        const routes = props.children.map(info => info.route);
        return new Coordinator(getWindow, globalId, routes);
    }, []);

    const pageWrappers = props.children.map((info, i) => {
        const pageConstructor = info.ctor;
        const client = coordinator.getClient(i);
        const page = pageConstructor(client);
        const wrapperId = client.wrapperId;
        return (<div key={i} id={wrapperId} className={styles.Wrapper}>{page}</div>);
    });

    useEffect(() => coordinator.goToDefault(), []);
    
    return (<div className={styles.Router}>{pageWrappers}</div>);
});
