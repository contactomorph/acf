"use client";
import { Session, SessionList } from "../data/sessions";
import HistoryRepository from "../model/HistoryRepository";

export default class FirebaseHistoryRepository implements HistoryRepository {
    listenToHistory(updateHistory: (sessions: SessionList) => void): void {
        const s0: Session = {
            id: "0",
            comment: "Trop facile",
            formula: "2 * (3km à vma)",
            place: "",
            time: new Date(2024, 5, 13),
            tags: [ "test vma", "club" ],
            training: null,
        };
        updateHistory({ "0": s0, });
    }
    upsertSession(_session: Session): Promise<void> {
        return new Promise<void>(() => {});
    }
}
