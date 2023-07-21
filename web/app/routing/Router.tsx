import { CSSProperties, useMemo, } from "react";
import { PageNumber, toWrapperId } from "./primitives";
import { RouterCore } from "./RouterCore";

export function Router(
    props: { children: ReadonlyArray<[constructor: (n: PageNumber) => JSX.Element, route: string]> }
): JSX.Element {
    const globalId = useMemo(generateGlobalId, []);
    const routes = props.children.map(pair => pair[1]);
    const divs = props.children.map((pair, i) => {
        const pageConstructor = pair[0];
        const n: PageNumber = { globalId, index: i };
        const style: CSSProperties = {
            visibility: i === 0 ? "visible" : "hidden",
            position: "absolute",
            padding: 0,
            margin: 0,
            width: "100%",
        };
        const page = pageConstructor(n);
        const wrapperId = toWrapperId(n);
        return (<div key={i} id={wrapperId} style={style}>{page}</div>);
    });
    return (<><RouterCore globalId={globalId} routes={routes}/>{divs}</>);
}

function generateGlobalId(): string {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random()).toString(16);
}