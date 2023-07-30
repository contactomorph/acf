import { CSSProperties, useMemo, } from "react";
import { Coordinator } from "./Coordinator";
import { RouterClient } from "./primitives";

export type PageInfo = {
    ctor: (client: RouterClient) => JSX.Element,
    route: string,
};

export function Router(
    props: { children: ReadonlyArray<PageInfo> }
): JSX.Element {
    const globalId = useMemo(generateGlobalId, []);
    const coordinator = useMemo(() => {
        const routes = props.children.map(info => info.route);
        return new Coordinator(globalId, routes);
    }, []);
    const pageWrappers = props.children.map((info, i) => {
        const pageConstructor = info.ctor;
        const style: CSSProperties = {
            visibility: i === 0 ? "visible" : "hidden",
            position: "absolute",
            padding: 0,
            margin: 0,
            width: "100%",
        };
        const client = coordinator.getClient(i);
        const page = pageConstructor(client);
        const wrapperId = client.wrapperId;
        return (<div key={i} id={wrapperId} style={style}>{page}</div>);
    });
    return (<>{pageWrappers}</>);
}

function generateGlobalId(): string {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random()).toString(16);
}