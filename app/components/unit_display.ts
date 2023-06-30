import chroma from "chroma-js";
import { Distance, Pace, Speed, TimeSpan } from "../data/units";
import { NBS } from "../components/icons";

export const DISTANCE_COLOR_NAME = "darkmagenta";
export const DURATION_COLOR_NAME = "darkcyan";
export const DISTANCE_BCOLOR_NAME = "pink";
export const DURATION_BCOLOR_NAME = "lightcyan";

export function stringifyDistance(distance: Distance): string {
    const km = Math.floor(distance.in_meter / 1000);
    const m = Math.floor(distance.in_meter % 1000);
    if (km === 0)
        return `${m}${NBS}m`;
    if (m === 0)
        return `${km}${NBS}km`;
    return `${km}${NBS}km${NBS}${m}${NBS}m`;
}

export function stringifyTimeSpan(ts: TimeSpan): string {
    let text = ts.hr !== 0 ? `${ts.hr}${NBS}h${NBS}` : "";
    const haveSeconds = ts.sec !== 0;
    if (ts.min !== 0) {
        text += `${ts.min}${NBS}min${NBS}`;
    } else if(ts.hr !== 0 && haveSeconds) {
        text += `0${NBS}min${NBS}`;
    }
    if (haveSeconds) {
        text += `${ts.sec}${NBS}s`;
    }
    return text;
}

export function stringifySpeed(s: Speed): string {
    const speedX10 = Math.round(s.in_meter_per_sec * 36);
    const units = Math.floor(speedX10 / 10);
    const deci = speedX10 - 10 * units;
    return `${units}.${deci}${NBS}km${NBS}/${NBS}h`
}

export function stringifyPace(p: Pace): string {
    return `${stringifyTimeSpan(p.in_time_per_km)}${NBS}/${NBS}km`;
}

const COLOR_SCALE = chroma.scale(['lightgreen', 'gold', 'orange', 'red', 'darkred']).domain([62, 77, 85, 97, 110]);

export function colorizeSpeed(speedPercentage: number): chroma.Color {
    return COLOR_SCALE(speedPercentage);
}
