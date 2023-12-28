import { Training } from './trainings';

export interface Session {
    readonly id: string;
    readonly date: Date;
    readonly place: string;
    readonly tags: ReadonlyArray<string>;
    readonly comment: string;
    readonly training: Training | null;
    readonly formula: string;
};

export interface SessionList {
    readonly [id: string] : Session;
};