import { Distance, Duration, Speed } from "./units";

export interface FactorForRefSpeed {
    minRefSpeed: Speed,
    factor: number,
};

export interface MultiFactor {
    defaultFactor: number,
    otherFactors: ReadonlyArray<FactorForRefSpeed>,
};

export interface TrainingInterval {
    isRecovery: boolean,
    speedPercentage: number,
    constraint: Duration | Distance,
};

export interface TrainingLoop {
    multiFactor: MultiFactor,
    intervals: Array<TrainingInterval>
};

export type Training = Array<TrainingInterval | TrainingLoop>;
