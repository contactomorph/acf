import cstyles from './TrainingPage.module.css';
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';
import { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import frLocale from "date-fns/locale/fr";
import './tools/set-extensions';
import { CHECK_BOX, WATCH } from './components/icons';
import { v4 as uuidv4 } from 'uuid';
import { ActivableTagSet } from './components/TagSet';

export default function TrainingHistoryPage(
    props: { client: RouterClient, model: Model, visible: boolean }
): JSX.Element {
    const { client, model, visible} = props;
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
    
    const [startingDate, setStartingDate] = useState<Date | null>(null);
    useEffect(() => {
        setVersion({});
        const lambda = () => setVersion({});
        model.subscribeToChange(lambda);
        return () => model.unsubscribe(lambda);
    }, [model]);

    const sessionBars = model.getOrderedSessions(Array.from(activeTags))
        .filter(s => startingDate == null || startingDate <= s.date)
        .map(s => {
            const onClick = () => client.goTo('creation', { id: s.id });
            return (<SessionBar session={s} key={s.id} onClick={onClick}/>);
        });

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
                                locale={frLocale}
                                dateFormat="dd/MM/yyyy"
                                selected={startingDate}
                                onChange={setStartingDate}
                            />
                        </td>
                    </tr>
                    <tr key="tags">
                        <td>{CHECK_BOX}</td>
                        <td>
                            <ActivableTagSet
                                activeTags={activeTags}
                                allTags={allTags}
                                onChange={() => setVersion({})}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        {sessionBars}
    </div>);
}
