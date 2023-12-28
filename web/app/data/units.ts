
export type SpeedLevel = "v10" | "vsm" | "vm" | "vma" | "vf";

export interface Duration { readonly in_sec: number };
export interface Distance { readonly in_meter: number };
export interface Speed { readonly in_meter_per_sec: number };

export interface TimeSpan {
    readonly hr: number,
    readonly min: number,
    readonly sec: number,
}

export function fromKmPerHour(in_km_per_hour: number): Speed {
    return { in_meter_per_sec: in_km_per_hour / 3.6 };
}

export interface Pace { readonly in_time_per_km: TimeSpan };

export function toTimeSpan(duration: Duration): TimeSpan {
    const totalSec = Math.floor(duration.in_sec);
    const totalMin = Math.floor(totalSec / 60);
    const sec = totalSec - 60 * totalMin;
    const hr = Math.floor(totalMin / 60);
    const min = totalMin - 60 * hr;
    return { hr, min, sec };
}

export function toPace(speed: Speed): Pace {
    const sec_per_km = 1000 / speed.in_meter_per_sec;
    return { in_time_per_km: toTimeSpan({ in_sec: sec_per_km }) };
}

export function computeDuration(speed: Speed, distance: Distance): Duration {
    return { in_sec: distance.in_meter / speed.in_meter_per_sec };
}

export function computeDistance(speed: Speed, duration: Duration): Distance {
    return { in_meter: duration.in_sec * speed.in_meter_per_sec };
}

const PERCENTAGE_PER_LEVEL = new Map<SpeedLevel, number>([
    ["vma" as SpeedLevel, 100],
    ["v10" as SpeedLevel, 88],
    ["vsm" as SpeedLevel, 83],
    ["vm" as SpeedLevel, 78],
    ["vf" as SpeedLevel, 63],
]);

export function assignPercentage(level: SpeedLevel): number {
    const perc = PERCENTAGE_PER_LEVEL.get(level);
    if (perc === undefined)
        throw new Error("unknown level");
    return perc;
}
