import { Distance, Duration, Pace, Speed, TimeSpan, computeDistance, computeDuration, toPace, toTimeSpan } from "../data/units";
import { CompleteInterval, Interval, Round } from "../data/intervals";
import { MultiFactor, Training } from "../data/trainings";

type SpeedSpecifier = (speedPercentage: number) => Speed;

interface MutableInterval {
    isRecovery: boolean,
    speedPercentage: number,
    speed: Speed,
    pace: Pace,
    from: "distance" | "duration",
    distance: Distance,
    cumulativeDistance: Distance,
    duration: Duration,
    cumulativeDuration: Duration,
    timeSpan: TimeSpan,
    cumulativeTimeSpan: TimeSpan,
    round: Round | undefined,
};

function completeInterval(interval: Interval, speedSpecifier: SpeedSpecifier): MutableInterval {
    const speed = speedSpecifier(interval.speedPercentage);
    let distance: Distance;
    let duration: Duration;
    let from: "distance" | "duration";
    if ("in_meter" in interval.constraint) {
        distance = interval.constraint;
        duration = computeDuration(speed, distance);
        from = "distance";
    } else {
        duration = interval.constraint;
        distance = computeDistance(speed, duration);
        from = "duration";
    }
    const timeSpan = toTimeSpan(duration);
    return {
        isRecovery: interval.isRecovery,
        speedPercentage: interval.speedPercentage,
        speed,
        distance,
        cumulativeDistance: distance,
        duration,
        cumulativeDuration: duration,
        from,
        timeSpan,
        cumulativeTimeSpan: timeSpan,
        pace: toPace(speed),
        round: undefined,
    };
}

function getFactor(multiFactor: MultiFactor, refSpeed: Speed): number {
    let factor = multiFactor.defaultFactor;
    for (const f of multiFactor.otherFactors) {
        if (f.minRefSpeed.in_meter_per_sec <= refSpeed.in_meter_per_sec) {
            factor = f.factor;
        }
    }
    return factor;
}

function removeLastIntervalIfRecoveryInsideLoop(intervals: CompleteInterval[]) {
    const lastInterval = intervals.at(-1);
    if (lastInterval?.isRecovery === true && lastInterval.round !== undefined) {
        intervals.pop();
    }
}

function pushMultipleRounds(to: CompleteInterval[], from: ReadonlyArray<MutableInterval>, factor: number) {
    for (let i=0; i < factor; ++i) {
        for(const interval of from) {
            const copy: MutableInterval = { ...interval };
            copy.round = {index: i, among: factor};
            to.push(copy);
        }
    }
}

function setCumulativeQuantities(intervals: ReadonlyArray<MutableInterval>) {
    let cumulativeMeters = 0;
    let cumulativeSeconds = 0;
    for (const interval of intervals) {
        cumulativeMeters += interval.distance.in_meter;
        interval.cumulativeDistance = { in_meter: cumulativeMeters };
        cumulativeSeconds += interval.duration.in_sec;
        interval.cumulativeDuration = { in_sec: cumulativeSeconds };
        interval.cumulativeTimeSpan = toTimeSpan(interval.cumulativeDuration);
    }
} 

export function computeIntervals(training: Training | undefined, speedSpecifier: SpeedSpecifier): Array<CompleteInterval> {
    if (training === undefined)
        return [];
    const intervals: MutableInterval[] = [];
    const refSpeed = speedSpecifier(100);
    for(const item of training) {
        if ("intervals" in item) {
            const factor = getFactor(item.multiFactor, refSpeed);
            const sequence = item.intervals.map(i => completeInterval(i, speedSpecifier));
            pushMultipleRounds(intervals, sequence, factor);
        } else {
            const interval = completeInterval(item, speedSpecifier);
            if (interval.isRecovery) {
                removeLastIntervalIfRecoveryInsideLoop(intervals);
            }
            intervals.push(interval);
        }
    }
    removeLastIntervalIfRecoveryInsideLoop(intervals);
    setCumulativeQuantities(intervals);
    return intervals;
}

