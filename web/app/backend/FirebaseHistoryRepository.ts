"use client";

import { FirebaseApp, initializeApp } from "@firebase/app";
import { getAuth, signInWithEmailAndPassword } from "@firebase/auth";
import { getDatabase, ref, onValue, DatabaseReference, Database, child, push, update } from "@firebase/database";
import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "../model/HistoryRepository";
import { Training } from "../data/trainings";
import { parseIso } from "../components/date_display";

const databaseURL = "https://acf-allure-default-rtdb.europe-west1.firebasedatabase.app";

const email = "de";
const password = "ps";

export type BackendSession = {
    readonly id?: string;
    readonly date?: string;
    readonly place?: string;
    readonly tags?: object;
    readonly comment?: string;
    readonly training?: object;
    readonly formula?: string;
};

type BackendSessionList = {
    readonly [id: string] : BackendSession;
};

export default class FirebaseHistoryRepository implements HistoryRepository {
    readonly _app: FirebaseApp;
    readonly _database: Database;

    constructor() {
        const firebaseConfig = { databaseURL, };
        this._app = initializeApp(firebaseConfig);
        this._database = getDatabase(this._app, databaseURL);
    }

    listenToHistory(updateHistory: (session: SessionList) => void): void {
        const starCountRef: DatabaseReference = ref(this._database, "/trainings/list");
        onValue(starCountRef, snapshot => updateHistory(this._complete(snapshot.val())));
    }

    upsertSession(session: Session): Promise<void> {
        const newPostKey = push(child(ref(this._database), '"/trainings/list')).key;

        const updates: any = {};
        updates['/trainings/list/' + newPostKey] = session;
      
        return update(ref(this._database), updates);
    }

    async dod() {
        const auth = getAuth(this._app);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Signed in 
            const user = userCredential.user;
        } catch(error) {
            // const errorCode = error.code;
            // const errorMessage = error.message;
        }
    }

    _complete(beSessions: BackendSessionList): SessionList {
        const sessions: any = {};
        for (const key in beSessions) {
            const beSession = beSessions[key];
            const tags: string[] = [];
            const tagsAsObj: any = beSession.tags ?? {};
            for(const key in tagsAsObj) {
                tags.push(tagsAsObj[key]);
            }
            const session: Session = {
                id: beSession.id ?? key,
                comment: beSession.comment ?? "",
                formula: beSession.formula ?? "",
                place: beSession.place ?? "",
                training: (beSession.training ?? null) as Training | null,
                date: (beSession.date ? parseIso(beSession.date) : null) ?? new Date(),
                tags: tags,
            };
            sessions[key] = session;
        }

        return sessions;
    }
}
