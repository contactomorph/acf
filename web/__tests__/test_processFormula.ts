import { Training } from "../app/data/trainings";
import { processFormula } from "../app/model/FormulaProcessor";
import { FormulaToken } from "../app/model/grammar/parsing";

function findProblematicText(firstToken: FormulaToken | undefined): string | null {
    let token = firstToken;
    while (token !== undefined) {
        if (!token.appropriate) { return token.text; }
        token = token.next;
    }
    return null;
}

test('Process formula with loop', () => {
    const formula = processFormula("3 * (300m à 83%, 100m à 94% recup 2min) recup 5min, 2km à 87%");

    const expectedTraining: Training = [
        {
            multiFactor: { defaultFactor: 3, otherFactors: [] },
            intervals: [
                { isRecovery: false, speedPercentage: 83, constraint: { in_meter: 300 } },
                { isRecovery: false, speedPercentage: 94, constraint: { in_meter: 100 } },
                { isRecovery: true, speedPercentage: 63, constraint: { in_sec: 120 } },
            ],
        },
        { isRecovery: true, speedPercentage: 63, constraint: { in_sec: 300 } },
        { isRecovery: false, speedPercentage: 87, constraint: { in_meter: 2000 } },
    ];
    expect(findProblematicText(formula.firstToken)).toBe(null);
    expect(formula.training).toEqual(expectedTraining);
});

test('Process formula with multi-factor loop on interval', () => {
    const formula = processFormula("3 ou 4 dès 12 * 300m à 83%");

    const expectedTraining: Training = [
        {
            multiFactor: {
                defaultFactor: 3,
                otherFactors: [ {factor: 4, minRefSpeed: { in_meter_per_sec: 3.333333333333333, } } ],
            },
            intervals: [
                { isRecovery: false, speedPercentage: 83, constraint: { in_meter: 300 } },
            ],
        },
    ];
    expect(findProblematicText(formula.firstToken)).toBe(null);
    expect(formula.training).toEqual(expectedTraining);
});

test('Process formula with multi-factor loop on sequence', () => {
    const formula = processFormula("3 ou 4 dès 12 * (300m à 83%, 100m à 90%)");

    const expectedTraining: Training = [
        {
            multiFactor: {
                defaultFactor: 3,
                otherFactors: [ {factor: 4, minRefSpeed: { in_meter_per_sec: 3.333333333333333, } } ],
            },
            intervals: [
                { isRecovery: false, speedPercentage: 83, constraint: { in_meter: 300 } },
                { isRecovery: false, speedPercentage: 90, constraint: { in_meter: 100 } },
            ],
        },
    ];
    expect(findProblematicText(formula.firstToken)).toBe(null);
    expect(formula.training).toEqual(expectedTraining);
});