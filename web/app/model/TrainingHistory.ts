import { Session } from "../data/sessions";

export class TrainingHistory {
    private readonly _sessionPerIds: Map<string, Session>;
    private readonly _orderedSessions: Session[];

    constructor() {
        this._sessionPerIds = new Map();
        this._orderedSessions = [];
    }

    upsertSession(session: Session): void {
        const previous = this._sessionPerIds.get(session.id);
        if (previous === undefined) {
            this._insert(session);
        } else {
            this._replace(previous, session);
        }
        this._sessionPerIds.set(session.id, session);
    }

    getOrderedSessions(tags: string[] | undefined = undefined): Session[] {
        if (tags === undefined) {
            return this._orderedSessions.slice();
        } else {
            const set: Set<string> = new Set(tags);
            return this._orderedSessions.filter(s => {
                return s.tags.length === 0 || s.tags.some(t => set.has(t));
            });
        }
    }

    private _insert(session: Session) {
        let position = this._orderedSessions.findIndex(s => this._isNewer(session, s));
        if (position < 0) {
            this._orderedSessions.push(session);
        } else {
            this._orderedSessions.copyWithin(position + 1, position);
            this._orderedSessions[position] = session;
        }
    }

    private _replace(previous: Session, session: Session) {
        const position = this._orderedSessions.indexOf(previous);
        this._orderedSessions[position] = session;
    }

    private _isNewer(s1: Session, s2: Session): boolean {
        return s1.time.getTime() > s2.time.getTime();
    }
}