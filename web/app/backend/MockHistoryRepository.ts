import { validate } from "uuid";
import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "../model/HistoryRepository";
import { Future } from "../tools/Future";

interface MutSessionList { [id: string] : Session; };

function makeSessionList(sessions: Session[]): MutSessionList {
    const sessionList: MutSessionList = {};
    for (const session of sessions) {
        if (!validate(session.id)) {
            throw new Error(`Invalid session id: ${session.id}`)
        }
        sessionList[session.id] = session;
    }
    return sessionList;
}

const s0: Session = {
    id: "125E10E4-EE47-4516-AEB9-AC34A6787ADC",
    comment: "Trop facile",
    formula: "2 * (3km à vma)",
    place: "Stade Alain Mimoun",
    date: new Date(2034, 5, 13),
    tags: [ "test vma", "club" ],
    training: null,
};
const s1: Session = {
    id: "CEE9E48C-825C-4FDF-B617-F6D4E08ECE0D",
    comment: "Trop dur",
    formula: `4 * (40" à 100% recup 30", 1' à 90% recup 40") recup 2'30", 4 * (40" à 100% recup 30", 1' à 90% recup 40")`,
    place: "Stade Leo Lagrange",
    date: new Date(2031, 3, 13),
    tags: [ "club" ],
    training: null,
};
const s2: Session = {
    id: "7C14AA93-C9DA-48A7-8D68-13BA865B3238",
    comment: "Parfait",
    formula: "2 * (3km à vma)",
    place: "Chez moi",
    date: new Date(2034, 5, 14),
    tags: [ "marathon" ],
    training: null,
};

export default class FirebaseHistoryRepository implements HistoryRepository {
    private readonly _sessionList: MutSessionList;
    private _updateHistory: (sessions: SessionList) => void;

    constructor(...sessions: Session[]) {
        this._updateHistory = () => {};
        const s = 0 < sessions.length ? sessions : [s0, s1, s2];
        this._sessionList = makeSessionList(s);
    }

    listenToHistory(updateHistory: (sessions: SessionList) => void): void {
        this._updateHistory = updateHistory;
        this._updateHistory(this._sessionList);
    }
    upsertSession(session: Session): Promise<void> {
        this._sessionList[session.id] = session;
        this._updateHistory(this._sessionList);
        return Future.pause();
    }

    deleteSession(id: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this._sessionList[id];
        this._updateHistory(this._sessionList);
        return Future.pause();
    }
}
