import MockHistoryRepository from "../app/backend/MockHistoryRepository";
import { Session } from "../app/data/sessions";
import Model from "../app/model/Model";

function expectSetContent<T>(actual: ReadonlySet<T>, ...expected: T[]): void {
    const expectedAndFound = new Set<T>();
    const expectedButNotFound: T[] = [];
    for(const item of expected) {
        if (actual.has(item)) {
            expectedAndFound.add(item);
        } else {
            expectedButNotFound.push(item);
        }
    }
    const notExpectedButFound: T[] = [];
    if (expectedAndFound.size < actual.size) {
        for(const item of actual.values()) {
            if (!expectedAndFound.has(item)) {
                notExpectedButFound.push(item);
            }
        }
    }
    const missing = 0 < expectedButNotFound.length;
    const unexpected = 0 < notExpectedButFound.length;
    if (missing || unexpected) {
        let message = "Set does not have appropriate content.";
        if (missing) {
            message += "\nSome items are missing:\n    " + expectedButNotFound.join("\n    ");
        }
        if (unexpected) {
            message += "\nSome items are unexpected:\n    " + notExpectedButFound.join("\n    ");
        }
        throw new Error(message);
    }
}

const SESSIONS: Session[] = [
    {
        id: "f7607e07-924f-4984-aad0-a2052ad61d25",
        date: new Date(2012, 2, 4),
        place: "Paris",
        tags: [ "marathon" ],
        comment: "Trés intéressant",
        training: null,
        formula: "3km à v10",
    },
    {
        id: "fe383e78-3fc8-44be-ba9c-1f7b5f84ae23",
        date: new Date(2013, 12, 1),
        place: "Lyon",
        tags: [ "semi", "difficile" ],
        comment: "Bof",
        training: null,
        formula: "3min à 96%",
    },
    {
        id: "8435c82b-8b6a-4604-8420-5c215539e5af",
        date: new Date(2005, 8, 30),
        place: "Toulouse",
        tags: [ "marathon", "facile" ],
        comment: "Ok",
        training: null,
        formula: "1km à 90%",
    },
];

test('Model provide sessions by increasing date', () => {
    const historyRepository = new MockHistoryRepository(...SESSIONS);
    const model = new Model(historyRepository);

    const dates = model.getOrderedSessions().map(s => s.date);

    expect(dates).toEqual([
        new Date(2005, 8, 30),
        new Date(2012, 2, 4),
        new Date(2013, 12, 1),
    ]);

    const tags = model.getTags();

    expectSetContent(tags, "marathon", "difficile", "facile", "semi");
});

test('Model accept additional session', async () => {
    const historyRepository = new MockHistoryRepository(...SESSIONS);
    const model = new Model(historyRepository);

    await historyRepository.upsertSession({
        id: "A03F883F-3D10-4569-9B2D-A71BF2AA26A6",
        comment: "nothing",
        date: new Date(2008, 1, 24),
        formula: "",
        place: "everywhere",
        training: null,
        tags: [ "facile", "décontracté" ],
    });

    const dates = model.getOrderedSessions().map(s => s.date);

    expect(dates).toEqual([
        new Date(2005, 8, 30),
        new Date(2008, 1, 24),
        new Date(2012, 2, 4),
        new Date(2013, 12, 1),
    ]);
    
    const tags = model.getTags();

    expectSetContent(tags, "décontracté", "marathon", "difficile", "facile", "semi");
});

test('Model update session', async () => {
    const historyRepository = new MockHistoryRepository(...SESSIONS);
    const model = new Model(historyRepository);

    await historyRepository.upsertSession({
        id: "fe383e78-3fc8-44be-ba9c-1f7b5f84ae23",
        date: new Date(2012, 1, 31),
        place: "Lyon",
        tags: [ "décontracté" ],
        comment: "Super",
        training: null,
        formula: "3min à 96%",
    });

    const sessions = model.getOrderedSessions();
    const dates = sessions.map(s => s.date);

    expect(dates).toEqual([
        new Date(2005, 8, 30),
        new Date(2012, 1, 31),
        new Date(2012, 2, 4),
    ]);

    const sessionB = sessions[1];

    expect(sessionB).toEqual({
        id: "fe383e78-3fc8-44be-ba9c-1f7b5f84ae23",
        date: new Date(2012, 1, 31),
        place: "Lyon",
        tags: [ "décontracté" ],
        comment: "Super",
        training: null,
        formula: "3min à 96%",
    });
    
    const tags = model.getTags();

    expectSetContent(tags, "décontracté", "marathon", "facile");
});


test('Model can delete session', async () => {
    const historyRepository = new MockHistoryRepository(...SESSIONS);
    const model = new Model(historyRepository);

    await model.deleteSession(SESSIONS[1].id);

    const sessions = model.getOrderedSessions();
    const dates = sessions.map(s => s.date);

    expect(dates).toEqual([
        new Date(2005, 8, 30),
        new Date(2012, 2, 4),
    ]);

    const tags = model.getTags();

    expectSetContent(tags, "marathon", "facile");
});