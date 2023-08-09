import { useMemo } from 'react';
import styles from './TrainingHistoryPage.module.css';
import Model from './model/Model';
import { SessionBar } from './components/SessionBar';
import { RouterClient } from './routing/primitives';
import FirebaseHistoryRepository from './backend/FirebaseHistoryRepository';

export default function TrainingHistoryPage(props: { client: RouterClient }): JSX.Element {
    
    const client = props.client;

    let buttons: JSX.Element[] = client.routes.map((r, i) => {
        const p = r === client.route ? { disabled: true }: {};
        return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
    });

    const history = useMemo(() => {
        return new Model(new FirebaseHistoryRepository());
    }, []);

    const sessions = history.getOrderedSessions().map(s => {
        return (<SessionBar session={s} key={s.id} />);
    });

    return (<div className={styles.Page}>{sessions}{buttons}</div>);
}