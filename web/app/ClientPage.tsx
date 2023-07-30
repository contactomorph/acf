"use client";

import { useState } from "react";
import { RouterClient } from "./routing/primitives";

export function ClientPage(props: { client: RouterClient, color: string }): JSX.Element {
    const [count, setCount] = useState(0);

    const client = props.client;
    let buttons: JSX.Element[] = client.routes.map((r, i) => {
        const p = r === client.route ? { disabled: true }: {};
        return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
    });

    return (<div style={{backgroundColor: props.color}}>
        <input type="button" onClick={() => setCount(count + 1)} value={`Clicked: ${count} times`}/>
        <div>Client page {client.index} {props.color}</div>
        <div>{buttons}</div>
    </div>);
}