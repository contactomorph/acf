import { useMemo } from 'react';
import styles from './TrainingHistoryPage.module.css';
import { TrainingHistory } from './model/TrainingHistory';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';

export default function TrainingHistoryPage(props: { client: RouterClient }): JSX.Element {
    
    const client = props.client;

    let buttons: JSX.Element[] = client.routes.map((r, i) => {
        const p = r === client.route ? { disabled: true }: {};
        return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
    });

    const history = useMemo(() => {
        const h = new TrainingHistory();
        h.upsertSession({
            id: "EZIZEOO",
            comment: "Facile",
            formula: "1km à v10",
            place: "Leo Lagrange",
            tags: [],
            time: new Date(2021, 3, 4, 19, 30, 0),
            training: null,
        });
        return h;
    }, []);

    const sessions = history.getOrderedSessions().map(s => {
        return (<SessionBar session={s} key={s.id} />);
    });

    return (<div className={styles.Page}>{sessions}{buttons}</div>);
}