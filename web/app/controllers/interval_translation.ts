import { ARROW, NBS, getIcon } from "../components/icons";
import { CompleteInterval } from "../data/intervals";
import { colorizeSpeed, stringifyDistance, stringifyTimeSpan } from '../components/unit_display';

interface Block {
    readonly color: chroma.Color,
    readonly width: number,
    readonly icon: string;
    readonly texts: ReadonlyArray<string>,
};

export function toDistanceBlocks(intervals: ReadonlyArray<CompleteInterval>): [Block[], string] {
    let total = "";
    const blocks = intervals.map(i => {
        total = stringifyDistance(i.cumulativeDistance);
        return {
            color: colorizeSpeed(i.speedPercentage),
            width: i.distance.in_meter,
            icon: getIcon(i.isRecovery),
            texts: [ stringifyDistance(i.distance), `${ARROW}${NBS}${total}` ],
        }
    });
    return [blocks, total];
}

export function toDurationBlocks(intervals: ReadonlyArray<CompleteInterval>): [Block[], string] {
    let total = "";
    const blocks = intervals.map(i => {
        total = stringifyTimeSpan(i.cumulativeTimeSpan);
        return {
            color: colorizeSpeed(i.speedPercentage),
            width: i.duration.in_sec,
            icon: getIcon(i.isRecovery),
            texts: [ stringifyTimeSpan(i.timeSpan), `${ARROW}${NBS}${total}` ],
        }
    });
    return [blocks, total];
}