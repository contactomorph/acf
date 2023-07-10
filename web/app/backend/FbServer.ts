import { FirebaseApp, initializeApp } from "@firebase/app";
import { getAuth, signInWithEmailAndPassword } from "@firebase/auth";
import { getDatabase, ref, onValue, DatabaseReference, Database, child, push, update } from "@firebase/database";
import { JSONValue } from "../tools/JSONValue";

const databaseURL = "https://acf-allure-default-rtdb.europe-west1.firebasedatabase.app";

const email = "de";
const password = "ps";

export class FbServer
{
    readonly _app: FirebaseApp;
    readonly _database: Database;

    constructor() {
        const firebaseConfig = { databaseURL, };
        this._app = initializeApp(firebaseConfig);
        this._database = getDatabase(this._app, databaseURL);
    }

    subscribe(updateData: (data: JSONValue) => void): void {
        const starCountRef: DatabaseReference = ref(this._database, "/trainings/list");
        onValue(starCountRef, snapshot => updateData(snapshot.val()));
    }

    post(data: JSONValue): Promise<void> {

        const newPostKey = push(child(ref(this._database), '"/trainings/list')).key;

        const updates: any = {};
        updates['/trainings/list/' + newPostKey] = data;
      
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
}
