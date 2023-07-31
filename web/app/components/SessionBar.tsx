"use client";
import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";

const OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('fr-Fr', OPTIONS);

export function SessionBar(props: { session: Session }) : JSX.Element {
    return (<div className={styles.Bar} key={props.session.id}>
        <table>
            <tr><td>Programe</td><td>{props.session.formula}</td></tr>
            <tr><td>Heure</td><td>{DATE_TIME_FORMAT.format(props.session.time)}</td></tr>
            <tr><td>Lieu</td><td>{props.session.place}</td></tr>
            <tr><td>Tags</td><td>{props.session.tags.join(', ')}</td></tr>
            <tr><td>Commentaire</td><td>{props.session.comment}</td></tr>
        </table>
    </div>);
}