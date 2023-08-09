import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "./HistoryRepository";

export default class Model {
    private readonly _sessionPerIds: Map<string, Session>;
    private readonly _orderedSessions: Session[];
    private readonly _historyRepository: HistoryRepository;
    private readonly _lambdas: (() => void)[];

    constructor(historyRepository: HistoryRepository) {
        this._sessionPerIds = new Map();
        this._orderedSessions = [];
        this._historyRepository = historyRepository;
        this._lambdas = [];
        this._historyRepository.listenToHistory(sessions => this._update(sessions));
    }

    subscribeToChange(lambda: () => void) {
        this._lambdas.push(lambda);
    }

    unsubscribe(lambda: () => void) {
        const index = this._lambdas.indexOf(lambda);
        if (0 <= index) {
            this._lambdas.splice(index);
        }
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
        let position = this._orderedSessions.findIndex(s => Model._properlyOrderedByTime(s, session));
        if (position < 0) {
            this._orderedSessions.push(session);
        } else {
            this._orderedSessions.copyWithin(position + 1, position);
            this._orderedSessions[position] = session;
        }
    }

    private _replace(previous: Session, session: Session) {
        const position = this._orderedSessions.indexOf(previous);
        if (0 <= position) {
            this._orderedSessions[position] = session;
        }
    }

    private static _properlyOrderedByTime(s1: Session, s2: Session): boolean {
        return s1.time.getTime() <= s2.time.getTime();
    }

    private static _compareTime(s1: Session, s2: Session): number {
        return s1.time.getTime() - s2.time.getTime();
    }

    private static _identical(s1: Session, s2: Session): boolean {
        if (s1 === s2)
            return true;
        return s1.comment === s2.comment &&
            s1.formula === s2.formula &&
            s1.place === s2.place &&
            +s1.time === +s2.time &&
            s1.tags.length === s2.tags.length &&
            s1.tags.every((tag, i) => s2.tags[i] === tag);
    }

    private _update(sessions: SessionList) {
        let updated: boolean = false;
        for(const key in sessions) {
            const receivedSession = sessions[key];
            const id = receivedSession.id;
            const existingSession = this._sessionPerIds.get(id);
            if (existingSession) {
                if (!Model._identical(existingSession, receivedSession)) {
                    updated = true;
                    this._sessionPerIds.set(id, receivedSession);
                }
            } else {
                updated = true;
                this._sessionPerIds.set(id, receivedSession);
            }
        }
        if (!updated) { return; }
        this._orderedSessions.length = 0;
        this._sessionPerIds.forEach(s => this._orderedSessions.push(s));
        this._orderedSessions.sort(Model._compareTime);
        this._lambdas.forEach(lambda => lambda());
    }
}