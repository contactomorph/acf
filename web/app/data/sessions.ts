import { Training } from './trainings';

export type Session = {
    readonly id: string;
    readonly time: Date;
    readonly place: string;
    readonly tags: ReadonlyArray<string>;
    readonly comment: string;
    readonly training: Training | null;
    readonly formula: string;
};