"use client";

import { FirebaseApp, initializeApp } from "@firebase/app";
import { getAuth, signInWithEmailAndPassword } from "@firebase/auth";
import { getDatabase, ref, onValue, DatabaseReference, Database, child, push, update } from "@firebase/database";
import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "../model/HistoryRepository";

const databaseURL = "https://acf-allure-default-rtdb.europe-west1.firebasedatabase.app";

const email = "de";
const password = "ps";

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

    _complete(sessions: SessionList): SessionList {
        for (const key in sessions) {
            const session: any = sessions[key];
            session.id ??= key;
            session.comment ??= "";
            session.formula ??= "";
            session.training ??= null;
            session.place ??= "";
            session.tags ??= [];
            session.time ??= new Date();
        }

        return sessions;
    }
}
