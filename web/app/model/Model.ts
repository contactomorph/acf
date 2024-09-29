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

    getSession(id: string): Session | undefined {
        return this._sessionPerIds.get(id);
    }

    upsertSession(session: Session): Promise<void> {
        return this._historyRepository.upsertSession(session);
    }

    deleteSession(id: string): Promise<void> {
        return this._historyRepository.deleteSession(id);
    }

    getOrderedSessions(tags: string[] | undefined = undefined): Session[] {
        if (tags === undefined) {
            return this._orderedSessions.slice();
        } else {
            const set = new Set<string>(tags);
            return this._orderedSessions.filter(s => {
                return s.tags.length === 0 || s.tags.some(t => set.has(t));
            });
        }
    }

    getTags(): Set<string> {
        const tags = this._orderedSessions.flatMap(s => s.tags);
        return new Set(tags);
    }

    private static _compareTime(s1: Session, s2: Session): number {
        return s2.date.getTime() - s1.date.getTime();
    }

    private static _identical(s1: Session, s2: Session): boolean {
        if (s1 === s2)
            return true;
        return s1.comment === s2.comment &&
            s1.formula === s2.formula &&
            s1.place === s2.place &&
            +s1.date === +s2.date &&
            s1.tags.length === s2.tags.length &&
            s1.tags.every((tag, i) => s2.tags[i] === tag);
    }

    private _update(sessions: SessionList) {
        let updated = false;
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
        const ids = new Set<string>(this._sessionPerIds.keys());
        for(const id of ids) {
            if (!(id in sessions)) {
                this._sessionPerIds.delete(id);
                updated = true;
            }
        }
        if (!updated) { return; }
        this._orderedSessions.length = 0;
        this._sessionPerIds.forEach(s => this._orderedSessions.push(s));
        // eslint-disable-next-line @typescript-eslint/unbound-method
        this._orderedSessions.sort(Model._compareTime);
        this._lambdas.forEach(lambda => lambda());
    }
}