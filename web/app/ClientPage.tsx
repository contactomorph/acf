"use client";

import { useState } from "react";
import { PageNumber } from "./routing/primitives";
import { getClient } from "./routing/RouterCore";

export function ClientPage(props: { n: PageNumber, color: string }): JSX.Element {
    const [count, setCount] = useState(0);

    const client = getClient(props.n);

    let buttons: JSX.Element[] = [];
    
    if (client !== undefined) {
        buttons = client.routes.map((r, i) => {
            const p = r === client.route ? { disabled: true }: {};
            return (<input type="button" onClick={() => client.goTo(r)} key={i} value={`To ${r}`} {...p}/>);
        });
    }

    return (<div style={{backgroundColor: props.color}}>
        <input type="button" onClick={() => setCount(count + 1)} value={`Clicked: ${count} times`}/>
        <div>Client page {props.n.index} {props.color}</div>
        <div>{buttons}</div>
    </div>);
}