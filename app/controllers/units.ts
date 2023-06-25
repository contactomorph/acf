import chroma from "chroma-js";
import { Distance, Pace, Speed, TimeSpan } from "../data/units";
import { NBS } from "../components/icons";

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
    const speed = s.in_meter_per_sec * 3.6;
    const units = Math.floor(speed);
    const deci = Math.floor(10 * (speed - units));
    return `${units}.${deci}${NBS}km${NBS}/${NBS}h`
}

export function stringifyPace(p: Pace): string {
    return `${stringifyTimeSpan(p.in_time_per_km)}${NBS}/${NBS}km`;
}

const COLOR_SCALE = chroma.scale(['lightgreen', 'gold', 'orange', 'red', 'darkred']).domain([62, 77, 85, 97, 110]);

export function colorizeSpeed(speedPercentage: number): chroma.Color {
    return COLOR_SCALE(speedPercentage);
}
