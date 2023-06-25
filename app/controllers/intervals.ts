import { ARROW, CHRONO, NBS, RULER, SHOES, getIcon } from "../components/icons";
import { CompleteInterval } from "../data/intervals";
import { colorizeSpeed, stringifyDistance, stringifyPace, stringifySpeed, stringifyTimeSpan } from "./units";

export function stringifyCompleteInterval(interval: CompleteInterval): string[] {    
    let primary: string;
    let secondary: string;
    if (interval.from === "distance") {
        primary = `${RULER}${NBS}${stringifyDistance(interval.distance)}`;
        secondary = `${CHRONO}${NBS}~${NBS}${stringifyTimeSpan(interval.timeSpan)}`;
    } else {
        primary = `${CHRONO}${NBS}${stringifyTimeSpan(interval.timeSpan)}`;
        secondary = `${RULER}${NBS}~${NBS}${stringifyDistance(interval.distance)}`;
    }
    const speedText = `${SHOES}${NBS}${stringifySpeed(interval.speed)}`;
    const paceText = `${SHOES}${NBS}${stringifyPace(interval.pace)}`;
    const modeText = getIcon(interval.isRecovery);
    return [modeText, primary, speedText, paceText, secondary];
}

type Block = {
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