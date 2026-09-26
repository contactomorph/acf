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
    return `${km}${NBS}${m}${NBS}m`;
}

export function stringifyTimeSpan(ts: TimeSpan): string {
    const secPrefix = ts.sec < 10 ? "0" : "";
    if(ts.hr !== 0) {
        const minPrefix = ts.min < 10 ? "0" : "";
        return `${ts.hr}h${minPrefix}${ts.min}′${secPrefix}${ts.sec}″`;
    } else {
        return `${ts.min}′${secPrefix}${ts.sec}″`;
    }
}

export function stringifySpeed(s: Speed): string {
    const speedX10 = Math.round(s.in_meter_per_sec * 36);
    const units = Math.floor(speedX10 / 10);
    const deci = speedX10 - 10 * units;
    return `${units}.${deci}${NBS}km${NBS}/${NBS}h`
}

export function stringifyPace(p: Pace): string {
    return stringifyTimeSpan(p.in_time_per_km);
}

const COLOR_SCALE = chroma.scale(['lightgreen', 'gold', 'orange', 'red', 'darkred']).domain([62, 77, 85, 97, 110]);

export function colorizeSpeed(speedPercentage: number): chroma.Color {
    return COLOR_SCALE(speedPercentage);
}
