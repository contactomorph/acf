"use client";
import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";
import { DATE_TIME_FORMAT } from './date_display';

export function SessionBar(props: { session: Session }) : JSX.Element {

    const tags = props.session.tags.map(
        t => {
            return (<><span className={styles.Tag}>&nbsp;{t}&nbsp;</span> </>);
        }
    );

    const tagLine = 0 < tags.length ?
        (<tr><td>Tags</td><td>{tags}</td></tr>) :
        (<></>);

    const commentLine = props.session.comment !== "" ?
        (<tr><td>Commentaire</td><td>{props.session.comment}</td></tr>) :
        (<></>);

    return (<div className={styles.Bar} key={props.session.id}>
        <table>
            <tbody>
                <tr><td>Programe</td><td>{props.session.formula}</td></tr>
                <tr><td>Heure</td><td>{DATE_TIME_FORMAT.format(props.session.time)}</td></tr>
                <tr><td>Lieu</td><td>{props.session.place}</td></tr>
                {tagLine}
                {commentLine}
            </tbody>
        </table>
    </div>);
}