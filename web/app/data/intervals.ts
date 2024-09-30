import { Distance, Duration, Pace, Speed, TimeSpan } from "./units";

export interface Interval {
    readonly isRecovery: boolean,
    readonly speedPercentage: number,
    readonly constraint: Distance | Duration,
};

export interface Round {
    sectionIndex: number,
    sectionCount: number,
    roundIndex: number;
    roundCount: number;
    blockIndex: number;
};

export interface CompleteInterval {
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
