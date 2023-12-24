
import { FirebaseApp, initializeApp } from "@firebase/app";
// import { getAuth, signInWithEmailAndPassword } from "@firebase/auth";
import { getDatabase, ref, onValue, DatabaseReference, Database, set, remove } from "@firebase/database";
import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "../model/HistoryRepository";
import { Training } from "../data/trainings";
import { parseIso } from "../components/date_display";
import { validate } from "uuid";

const databaseURL = "https://acf-allure-default-rtdb.europe-west1.firebasedatabase.app";

export interface BackendSession {
    readonly date?: string;
    readonly place?: string;
    readonly tags?: object;
    readonly comment?: string;
    readonly training?: object;
    readonly formula?: string;
};

interface BackendSessionList {
    readonly [id: string] : BackendSession;
};

function toIsoDate(date: string | undefined): Date {
    return (date ? parseIso(date) : null) ?? new Date();
}

function toBackendSession(session: Session): BackendSession {
    const tagsAsObj: Record<string, string> = {};
    let i = 0;
    for (const tag of session.tags) {
        tagsAsObj[`${i}`] = tag;
        ++i;
    }
    const beSession: BackendSession = {
        date: session.date.toISOString(),
        comment: session.comment,
        formula: session.formula,
        place: session.place,
        tags: tagsAsObj,
    };
    // if (session.training) {
    //     (beSession as any).training = session.training;
    // }
    return beSession;
}

function toSession(id: string, beSession: BackendSession): Session {
    const tags: string[] = [];
    const tagsAsObj = beSession.tags ?? {};
    for(const key in tagsAsObj) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        tags.push((tagsAsObj as any)[key] as string);
    }
    return {
        id,
        comment: beSession.comment ?? "",
        formula: beSession.formula ?? "",
        place: beSession.place ?? "",
        training: (beSession.training ?? null) as Training | null,
        date: toIsoDate(beSession.date),
        tags: tags,
    };
}

export default class FirebaseHistoryRepository implements HistoryRepository {
    readonly _app: FirebaseApp;
    readonly _database: Database;

    constructor() {
        const firebaseConfig = { databaseURL, };
        this._app = initializeApp(firebaseConfig);
        this._database = getDatabase(this._app, databaseURL);
    }

    listenToHistory(updateHistory: (session: SessionList) => void): void {
        const sessionListRef: DatabaseReference = ref(this._database, "/trainings/list");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        onValue(sessionListRef, snapshot => updateHistory(this._complete(snapshot.val())));
    }

    upsertSession(session: Session): Promise<void> {
        const id = session.id;
        if (!validate(id)) {
            throw new Error(`Invalid session id: ${id}`);
        }
        const sessionRef = ref(this._database, "/trainings/list/" + id);

        return set(sessionRef, toBackendSession(session));
    }

    deleteSession(id: string): Promise<void> {
        const sessionRef = ref(this._database, "/trainings/list/" + id);
        
        return remove(sessionRef);
    }

    private _complete(beSessions: BackendSessionList): SessionList {
        const sessions: SessionList = {};

        for (const id in beSessions) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (sessions as any)[id] = toSession(id, beSessions[id]);
        }

        return sessions;
    }
}
