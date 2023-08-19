"use client";
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';
import { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { same, setContent } from './tools/set-extensions';

export default function TrainingHistoryPage(
    props: { client: RouterClient, model: Model | null }
): JSX.Element {
    const client = props.client;
    const model = props.model;

    const [version, setVersion] = useState({});

    const [allTags] = useState(() => new Set<string>());
    const [activeTags] = useState(() => new Set<string>());

    useMemo(() => {
        if (model) {
            const modelTags = model.getTags();
            if (!same(modelTags, allTags)) {
                setContent(allTags, modelTags);
                setContent(activeTags, modelTags);
            }
        }
    }, [model, version]);
    
    const [startingDate, setStartingDate] = useState<Date>(() => new Date());
    useEffect(() => {
        if (model) {
            setVersion({});
            const lambda = () => setVersion({});
            model.subscribeToChange(lambda);
            return () => model.unsubscribe(lambda);
        }
    }, [model]);
    const toggle = useMemo(() => (t: string, target: HTMLSpanElement) => {
        if (activeTags.has(t)) {
            target.className = styles.InactiveTag;
            activeTags.delete(t);
        } else {
            target.className = styles.ActiveTag;
            activeTags.add(t);
        }
        setVersion({});
    }, [activeTags]);

    let buttons: JSX.Element[] = client.routes.map((r, i) => {
        const p = r === client.route ? { disabled: true }: {};
        return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
    });

    const spans: JSX.Element[] = Array.from(allTags.entries()).map(([t]) => {
        const className = activeTags.has(t) ? styles.ActiveTag : styles.InactiveTag;
        return (<>
            <span className={className} onClick={e => toggle(t, e.currentTarget)}>
                &nbsp;{t}&nbsp;
            </span>
            &nbsp;
        </>);
    });

    const sessionBars = (model?.getOrderedSessions(Array.from(activeTags)) ?? [])
        .filter(s => startingDate <= s.time)
        .map(s => (<SessionBar session={s} key={s.id} />));

    function onDateChange(date: Date | null) {
        if (date !== null) { setStartingDate(date); }
    }

    return (<div className={styles.Page}>
        <div className={styles.Bar}>
            <table>
                <tbody>
                    <tr key="from">
                        <td>À partir de</td>
                        <td>
                            <DatePicker selected={startingDate} onChange={onDateChange}/>
                        </td>
                    </tr>
                    <tr key="tags"><td>Filtres</td><td>{spans}</td></tr>
                </tbody>
            </table>
        </div>
        {sessionBars}
        {buttons}
    </div>);
}
