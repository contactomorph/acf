"use client";
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';
import { useEffect, useState } from 'react';

export default function TrainingHistoryPage(
    props: { client: RouterClient, model: Model | null }
): JSX.Element {
    const client = props.client;
    const model = props.model;

    const [, setVersion] = useState({});

    useEffect(() => {
        if (model) {
            const lambda = () => setVersion({});
            model.subscribeToChange(lambda);
            return () => model.unsubscribe(lambda);
        }
    }, [model]);

    let buttons: JSX.Element[] = client.routes.map((r, i) => {
        const p = r === client.route ? { disabled: true }: {};
        return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
    });

    const sessionBars = (props.model?.getOrderedSessions() ?? []).map(s => {
        return (<SessionBar session={s} key={s.id} />);
    });

    return (<div className={styles.Page}>{sessionBars}{buttons}</div>);
}