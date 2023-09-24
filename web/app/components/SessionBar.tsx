"use client";
import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";
import { DATE_TIME_FORMAT } from './date_display';
import { CHECK_BOX, COMMENT, PIN, WATCH, getIcon } from './icons';
import { memo } from 'react';

export const SessionBar = memo(function(
    props: { session: Session }
) : JSX.Element {
    const tags = props.session.tags.map(
        t => {
            return (<><span className={styles.Tag}>&nbsp;{t}&nbsp;</span> </>);
        }
    );

    const tagLine = 0 < tags.length ?
        (<tr><td>{CHECK_BOX}</td><td>{tags}</td></tr>) :
        (<></>);

    const commentLine = props.session.comment !== "" ?
        (<tr><td>{COMMENT}</td><td>{props.session.comment}</td></tr>) :
        (<></>);

    return (<div className={styles.Bar} key={props.session.id}>
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
});
