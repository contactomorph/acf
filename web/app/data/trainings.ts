import { Distance, Duration, Speed } from "./units";

export type FactorForRefSpeed = {
    minRefSpeed: Speed,
    factor: number,
};

export type MultiFactor = {
    defaultFactor: number,
    otherFactors: ReadonlyArray<FactorForRefSpeed>,
};

export type TrainingInterval = {
    isRecovery: boolean,
    speedPercentage: number,
    constraint: Duration | Distance,
};

export type TrainingLoop = {
    multiFactor: MultiFactor,
    intervals: Array<TrainingInterval>
};

export type Training = Array<TrainingInterval | TrainingLoop>;
