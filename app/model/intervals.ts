import { Distance, Duration, Pace, Speed, TimeSpan } from "./units";

export type Interval = {
    readonly isRecovery: boolean,
    readonly speedPercentage: number,
    readonly constraint: Distance | Duration,
};

export type Round = {
    index: number;
    among: number;
};

export type CompleteInterval = {
    readonly isRecovery: boolean,
    readonly speedPercentage: number,
    readonly speed: Speed,
    readonly pace: Pace,
    readonly from: "distance" | "duration",
    readonly distance: Distance,
    readonly cumulativeDistance: Distance,
    readonly duration: Duration,
    readonly cumulativeDuration: Duration,
    readonly timeSpan: TimeSpan,
    readonly cumulativeTimeSpan: TimeSpan,
    readonly round: Round | undefined,
};
