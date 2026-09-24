import cstyles from './TrainingPage.module.css';
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { Session } from './data/sessions';
import { SessionBar } from './components/SessionBar';
import { TrainingCalendar, DayStatus } from './components/TrainingCalendar';
import { RouterClient } from './routing/primitives';
import { useEffect, useMemo, useState } from 'react';
import './tools/set-extensions';
import { CHECK_BOX } from './components/icons';
import { v4 as uuidv4 } from 'uuid';
import { ActivableTagSet } from './components/TagSet';
import { SharedLink } from './components/SharedLink';
import { CalendarDay } from './data/calendar_day';
import { DATE_FORMAT } from './components/date_display';
import { Future } from './tools/Future';

function createDisplayUrl(id: string): string {
    const params = new URLSearchParams(window.location.search);
    params.set('page', 'display');
    params.set('id', id);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

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

    const today = useMemo(() => CalendarDay.today(), []);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

    useEffect(() => {
        setVersion({});
        const lambda = () => setVersion({});
        model.subscribeToChange(lambda);
        return () => model.unsubscribe(lambda);
    }, [model]);

    const allSessions = model.getOrderedSessions();
    const filteredSessions = model.getOrderedSessions(Array.from(activeTags));

    const allSessionsByDay = useMemo(() => {
        const map = new Map<string, Session>();
        for (const session of allSessions) {
            map.set(CalendarDay.fromDate(session.date).asString(), session);
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allSessions]);

    const dayStatuses = useMemo(() => {
        const matchedKeys = new Set<string>();
        for (const session of filteredSessions) {
            matchedKeys.add(CalendarDay.fromDate(session.date).asString());
        }
        const statuses = new Map<string, DayStatus>();
        for (const dayKey of allSessionsByDay.keys()) {
            statuses.set(dayKey, matchedKeys.has(dayKey) ? DayStatus.Matched : DayStatus.Unmatched);
        }
        return statuses;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredSessions, allSessionsByDay]);

    const selectedSession = selectedDay ? allSessionsByDay.get(selectedDay.asString()) : undefined;

    const selectDay = (day: CalendarDay) => {
        setSelectedDay(selectedDay !== null && day.equals(selectedDay) ? null : day);
    };

    const deleteSession = (id: string) => {
        Future.forget(model.deleteSession(id));
        setSelectedDay(null);
    };

    let detailPanel: JSX.Element = (<></>);
    
    if (selectedDay !== null && selectedSession === undefined) {

        detailPanel = (<div
            className={styles.CreationPanel}
            onClick={() => client.goTo('creation', { id: uuidv4(), date: selectedDay.asString() })}
            role='new_training'
        >
            Nouvelle séance le {DATE_FORMAT.format(selectedDay.toDate())}
        </div>);

    } else if (selectedDay !== null && selectedSession !== undefined) {

        detailPanel = (<div className={styles.ClickablePanel}>
            <SessionBar
                session={selectedSession}
                onClick={() => client.goTo('creation', { id: selectedSession.id })}
                includesText={true}
                footer={<div
                    className={cstyles.BoxText}
                    onClick={(event) => event.stopPropagation()}
                >
                    <input
                        type="button"
                        className={cstyles.Command}
                        onClick={() => deleteSession(selectedSession.id)}
                        value={`Supprimer`}
                    />
                    <SharedLink url={createDisplayUrl(selectedSession.id)} />
                </div>}
            />
        </div>);
    }

    return (<div className={styles.Page}>
        <div className={styles.Bar}>
            <table style={{width: "100%"}}>
                <tbody>
                    <tr key="tags">
                        <td className={cstyles.Label}>{CHECK_BOX}&nbsp;Pour&nbsp;</td>
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
        <TrainingCalendar
            statusPerDay={dayStatuses}
            selectedDay={selectedDay}
            today={today}
            onSelectDay={selectDay}
        />
        {detailPanel}
    </div>);
}
