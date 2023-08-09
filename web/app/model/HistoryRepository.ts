import { Session, SessionList } from "../data/sessions";

export default interface HistoryRepository {
    listenToHistory(updateHistory: (sessions: SessionList) => void): void;
    upsertSession(session: Session): Promise<void>;
}