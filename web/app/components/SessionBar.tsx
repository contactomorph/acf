import styles from './SessionBar.module.css';
import { Session } from "../data/sessions";
import { DATE_TIME_FORMAT } from './date_display';
import { CHECK_BOX, COMMENT, PIN, CALENDAR, getIcon, NBS } from './icons';
import { MouseEventHandler } from 'react';
import { ImmutableTagSet } from './TagSet';

export function SessionBar(props: {
    session: Session,
    onClick: MouseEventHandler | undefined,
    footer: JSX.Element | undefined,
    includesText: boolean,
}) : JSX.Element {
    const { session: { id, comment, formula, date, place, tags }, onClick, footer, includesText } = props;
    const tagSet = new Set<string>(tags);

    const bStyle = onClick? `${styles.Bar} ${styles.Clickable}` : styles.Bar;
    const lStyle = includesText? styles.Label : styles.ShortLabel;

    const tagLabel = includesText? `${CHECK_BOX}${NBS}Catégories${NBS}` : `${CHECK_BOX}${NBS}`;
    const tagLine = 0 < tagSet.size ?
        (<tr><td className={lStyle}>{tagLabel}</td><td><ImmutableTagSet tags={tagSet} /></td></tr>) :
        (<></>);

    const commentLabel = includesText? `${COMMENT}${NBS}Notes${NBS}` : `${COMMENT}${NBS}`;
    const commentLine = comment !== "" ?
        (<tr><td className={lStyle}>{commentLabel}</td><td>{comment}</td></tr>) :
        (<></>);

    const trainingLabel = includesText? `${getIcon(false)}${NBS}Programme${NBS}` : `${getIcon(false)}${NBS}`;
    const dateLabel = includesText? `${CALENDAR}${NBS}Date${NBS}` : `${CALENDAR}${NBS}`;
    const placeLabel = includesText? `${PIN}${NBS}Lieu${NBS}` : `${PIN}${NBS}`;
    return (<div className={bStyle} key={id} onClick={onClick}>
        <table>
            <tbody>
                <tr><td className={lStyle}>{trainingLabel}</td><td>{formula}</td></tr>
                <tr><td className={lStyle}>{dateLabel}</td><td>{DATE_TIME_FORMAT.format(date)}</td></tr>
                <tr><td className={lStyle}>{placeLabel}</td><td>{place}</td></tr>
                {tagLine}
                {commentLine}
            </tbody>
        </table>
        {footer}
    </div>);
}
