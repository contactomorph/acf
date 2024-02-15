import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";
import { DATE_TIME_FORMAT } from './date_display';
import { CHECK_BOX, COMMENT, PIN, WATCH, getIcon } from './icons';
import { MouseEventHandler } from 'react';
import { ImmutableTagSet } from './TagSet';

export function SessionBar(
    props: { session: Session, onClick: MouseEventHandler }
) : JSX.Element {
    const { session: { id, comment, formula, date, place, tags }, onClick } = props;
    const tagSet = new Set<string>(tags);

    const tagLine = 0 < tagSet.size ?
        (<tr><td>{CHECK_BOX}</td><td><ImmutableTagSet tags={tagSet} /></td></tr>) :
        (<></>);

    const commentLine = comment !== "" ?
        (<tr><td>{COMMENT}</td><td>{comment}</td></tr>) :
        (<></>);

    return (<div className={styles.Bar} key={id} onClick={onClick}>
        <table>
            <tbody>
                <tr><td>{getIcon(false)}</td><td>{formula}</td></tr>
                <tr><td>{WATCH}</td><td>{DATE_TIME_FORMAT.format(date)}</td></tr>
                <tr><td>{PIN}</td><td>{place}</td></tr>
                {tagLine}
                {commentLine}
            </tbody>
        </table>
    </div>);
}
