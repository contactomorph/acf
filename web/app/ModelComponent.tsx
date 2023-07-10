"use client";

import { useEffect } from "react";
import FirebaseHistoryRepository from "./backend/FirebaseHistoryRepository";
import Model from "./model/Model";

export default function ModelComponent(
    props: { setModel: (model: Model) => void }
): JSX.Element {

    useEffect(() => {
        const model = new Model(new FirebaseHistoryRepository());
        props.setModel(model);
    }, [props.setModel]);

    return (<></>);
}