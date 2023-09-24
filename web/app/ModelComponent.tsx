"use client";

import { useEffect, memo } from "react";
import FirebaseHistoryRepository from "./backend/FirebaseHistoryRepository";
import Model from "./model/Model";

export default memo(function(
    props: { setModel: (model: Model) => void }
): JSX.Element {

    useEffect(() => {
        const model = new Model(new FirebaseHistoryRepository());
        props.setModel(model);
    }, [props.setModel]);

    return (<></>);
});