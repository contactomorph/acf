import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";
import { DATE_TIME_FORMAT } from './date_display';
import { CHECK_BOX, COMMENT, PIN, WATCH, getIcon } from './icons';
import { MouseEventHandler } from 'react';
import { ImmutableTagSet } from './TagSet';

export function SessionBar(
    props: { session: Session, onClick: MouseEventHandler }
) : JSX.Element {
    const tags = new Set<string>(props.session.tags);

    const tagLine = 0 < tags.size ?
        (<tr><td>{CHECK_BOX}</td><td><ImmutableTagSet tags={tags} /></td></tr>) :
        (<></>);

    const commentLine = props.session.comment !== "" ?
        (<tr><td>{COMMENT}</td><td>{props.session.comment}</td></tr>) :
        (<></>);

    return (<div className={styles.Bar} key={props.session.id} onClick={props.onClick}>
        <table>
            <tbody>
                <tr><td>{getIcon(false)}</td><td>{props.session.formula}</td></tr>
                <tr><td>{WATCH}</td><td>{DATE_TIME_FORMAT.format(props.session.date)}</td></tr>
                <tr><td>{PIN}</td><td>{props.session.place}</td></tr>
                {tagLine}
                {commentLine}
            </tbody>
        </table>
    </div>);
}
