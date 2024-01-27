import cstyles from './TrainingPage.module.css';
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import frLocale from "date-fns/locale/fr";
import './tools/set-extensions';
import { CHECK_BOX, WATCH } from './components/icons';
import { v4 as uuidv4 } from 'uuid';

export default function TrainingHistoryPage(
    props: { client: RouterClient, model: Model, visible: boolean }
): JSX.Element {
    const client = props.client;
    const model = props.model;
    const visible = props.visible;

    const [version, setVersion] = useState({});

    const allTags = useMemo(() => new Set<string>(), []);
    const activeTags = useMemo(() => new Set<string>(), []);

    /* eslint-disable react-hooks/exhaustive-deps */
    useMemo(() => {
        if (visible) {
            const modelTags = model.getTags();
            if (!modelTags.same(allTags)) {
                modelTags.setContentOf(allTags);
                modelTags.setContentOf(activeTags);
            }
        }
    }, [model, version, visible]);
    /* eslint-enable react-hooks/exhaustive-deps */
    
    const [startingDate, setStartingDate] = useState<Date>(() => new Date());
    useEffect(() => {
        setVersion({});
        const lambda = () => setVersion({});
        model.subscribeToChange(lambda);
        return () => model.unsubscribe(lambda);
    }, [model]);
    const toggle = useCallback((t: string, target: HTMLSpanElement) => {
        if (activeTags.has(t)) {
            target.className = styles.InactiveTag;
            activeTags.delete(t);
        } else {
            target.className = styles.ActiveTag;
            activeTags.add(t);
        }
        setVersion({});
    }, [activeTags]);

    const spans: JSX.Element[] = Array.from(allTags.entries()).map(([t]) => {
        const className = activeTags.has(t) ? styles.ActiveTag : styles.InactiveTag;
        return (<>
            <span className={className} onClick={e => toggle(t, e.currentTarget)}>
                &nbsp;{t}&nbsp;
            </span>
            &nbsp;
        </>);
    });

    const sessionBars = model.getOrderedSessions(Array.from(activeTags))
        .filter(s => startingDate <= s.date)
        .map(s => {
            const onClick = () => client.goTo('creation', { id: s.id });
            return (<SessionBar session={s} key={s.id} onClick={onClick}/>);
        });

    function onDateChange(date: Date | null) {
        if (date !== null) { setStartingDate(date); }
    }

    return (<div className={styles.Page}>
        <div className={cstyles.BoxText}>
            <input
                type="button"
                onClick={() => client.goTo('creation', { id: uuidv4() })}
                value={`Nouveau`}
                role='new_training'
            />
        </div>
        <div className={styles.Bar}>
            <table>
                <tbody>
                    <tr key="from">
                        <td>{WATCH}</td>
                        <td>
                            <DatePicker
                                selected={startingDate}
                                onChange={onDateChange}
                                locale={frLocale}
                                dateFormat="dd/MM/yyyy"
                            />
                        </td>
                    </tr>
                    <tr key="tags">
                        <td>{CHECK_BOX}</td>
                        <td>{spans}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        {sessionBars}
    </div>);
}
