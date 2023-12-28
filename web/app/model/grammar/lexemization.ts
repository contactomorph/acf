import { SpeedLevel, assignPercentage } from "../../data/units";
import { ArrayIterator } from "../../tools/ArrayIterator";
import { Morpheme, Range, MorphemeCategory } from "./morphemization";

function concatMorpheme(a: Morpheme, b: Morpheme): Morpheme {
    return {
        mode: a.mode,
        margin: a.margin,
        content: a.content + b.margin + b.content,
        range: {
            columnBegin: a.range.columnBegin,
            columnEnd: b.range.columnEnd,
            index: a.range.index,
        },
    };
}

export enum UnknownLexemeKind {
    Unknown = 0,
};

export enum NumericLexemeKind {
    Speed = 10,
    Duration,
    Distance,
    Factor,
};

export enum KeywordLexemeKind {
    OParens = 20,
    CParens,
    Then,
    Or,
    Times,
    RunningAt,
    From,
    Recovering,
};

export type LexemeKind = UnknownLexemeKind | NumericLexemeKind | KeywordLexemeKind;

interface BaseLexeme {
    margin: string,
    text: string,
    range: Range,
};

export type NumericLexeme = BaseLexeme & {
    kind: NumericLexemeKind,
    value: number,
};

export type UnkownLexeme = BaseLexeme & {
    kind: UnknownLexemeKind.Unknown,
    info: string,
};

export type KeywordLexem = BaseLexeme & {
    kind: KeywordLexemeKind,
};

export type Lexeme = NumericLexeme | UnkownLexeme | KeywordLexem;

const SPEED_LEVELS: ReadonlySet<SpeedLevel> = new Set<SpeedLevel>([
    "v10" as SpeedLevel,
    "vf",
    "vm",
    "vsm",
    "vma",
]);

const KEYWORDS = new Map<string, KeywordLexemeKind>([
    ["à", KeywordLexemeKind.RunningAt],
    ["a", KeywordLexemeKind.RunningAt],
    ["dès", KeywordLexemeKind.From],
    ["des", KeywordLexemeKind.From],
    ["ou", KeywordLexemeKind.Or],
    ["|", KeywordLexemeKind.Or],
    ["puis", KeywordLexemeKind.Then],
    [",", KeywordLexemeKind.Then],
    ["récup", KeywordLexemeKind.Recovering],
    ["recup", KeywordLexemeKind.Recovering],
    ["(", KeywordLexemeKind.OParens],
    [")", KeywordLexemeKind.CParens],
    ["*", KeywordLexemeKind.Times],
    ["fois", KeywordLexemeKind.Times],
]);

function toNumericLexeme(morpheme: Morpheme, kind: NumericLexemeKind, value: number) : NumericLexeme {
    return {
        kind,
        margin: morpheme.margin,
        text: morpheme.content,
        range: morpheme.range,
        value,
    }
}

function toUnknownLexeme(morpheme: Morpheme, info: string) : UnkownLexeme {
    return {
        kind: UnknownLexemeKind.Unknown,
        margin: morpheme.margin,
        text: morpheme.content,
        range: morpheme.range,
        info,
    }
}

function toKeywordLexeme(morpheme: Morpheme, kind: KeywordLexemeKind) : KeywordLexem {
    return {
        kind,
        margin: morpheme.margin,
        text: morpheme.content,
        range: morpheme.range,
    }
}

const units: ReadonlyMap<string, [number, NumericLexemeKind]> = new Map<string, [number, NumericLexemeKind]>([
    ["m", [1, NumericLexemeKind.Distance]],
    ["km", [1000, NumericLexemeKind.Distance]],
    ["s", [1, NumericLexemeKind.Duration]],
    ["min", [60, NumericLexemeKind.Duration]],
    ["h", [3600, NumericLexemeKind.Duration]],
    ["'", [60, NumericLexemeKind.Duration]],
    ["\"", [1, NumericLexemeKind.Duration]],
    ["%", [1, NumericLexemeKind.Speed]],
]);

function retrieveKeyword(morpheme: Morpheme): Lexeme | undefined {
    const kind = KEYWORDS.get(morpheme.content);
    if (kind !== undefined)
        return toKeywordLexeme(morpheme, kind);
    return undefined;
}

function retrieveSpeed(it: ArrayIterator<Morpheme>): Lexeme | undefined {
    const morpheme = it.current;
    if (morpheme === undefined)
        return undefined;
    if (SPEED_LEVELS.has(morpheme.content as SpeedLevel))
        return toNumericLexeme(morpheme, NumericLexemeKind.Speed, assignPercentage(morpheme.content as SpeedLevel));
    
    if (morpheme.content !== "v")
        return undefined;
    const next = it.next;
    if (next !== undefined && next.content === "10" && next.margin === "") {
        it.moveToNext();
        const speedLexeme = toNumericLexeme(morpheme, NumericLexemeKind.Speed, assignPercentage("v10"));
        speedLexeme.text = "v10";
        return speedLexeme;
    }
}

function retrieveQuantity(it: ArrayIterator<Morpheme>): Lexeme | undefined {
    let morpheme = it.current;
    if (morpheme === undefined || morpheme.mode !== MorphemeCategory.Numeric)
        return undefined;
    let value = parseInt(morpheme.content);
    let sMorpheme = morpheme;
    
    morpheme = it.next;
    if (morpheme === undefined || morpheme.mode !== MorphemeCategory.Text) {
        return toNumericLexeme(sMorpheme, NumericLexemeKind.Factor, value);
    }
    const unit = units.get(morpheme.content);
    if (unit === undefined) {
        return toNumericLexeme(sMorpheme, NumericLexemeKind.Factor, value);
    }
    it.moveToNext();
    sMorpheme = concatMorpheme(sMorpheme, morpheme);
    const [factor, category] = unit;
    value *= factor;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while(true) {
        morpheme = it.next;
        if (morpheme === undefined || morpheme.mode !== MorphemeCategory.Numeric) {
            return toNumericLexeme(sMorpheme, category, value);
        }
        it.moveToNext();
        sMorpheme = concatMorpheme(sMorpheme, morpheme);
        const subValue = parseInt(morpheme.content);
        morpheme = it.next;
        if (morpheme === undefined || morpheme.mode !== MorphemeCategory.Text) {
            return toUnknownLexeme(sMorpheme, "Expected unit");
        }
        it.moveToNext();
        const unit = units.get(morpheme.content);
        if (unit === undefined) {
            return toUnknownLexeme(sMorpheme, "Expected unit");
        }
        sMorpheme = concatMorpheme(sMorpheme, morpheme);
        const [newFactor, newCategory] = unit;
        value += newFactor * subValue;
        if (category !== newCategory) {
            return toUnknownLexeme(sMorpheme, "Inconsistent unit");
        }
    }
}

export function lexemize(morphemes: ReadonlyArray<Morpheme>): ReadonlyArray<Lexeme> {
    const lexemes : Lexeme[] = [];
    const it = new ArrayIterator<Morpheme>(morphemes);
    let morpheme: Morpheme | undefined;
    let lexeme: Lexeme | undefined;
    /* eslint-disable no-cond-assign */
    while (morpheme = it.moveToNext()) {
        switch (morpheme.mode) {
            case MorphemeCategory.Sigil:
                lexemes.push(retrieveKeyword(morpheme)!);
                break;
            case MorphemeCategory.Text:
                if (lexeme = retrieveKeyword(morpheme)) {
                    lexemes.push(lexeme);
                    break;
                }
                if (lexeme = retrieveSpeed(it)) {
                    lexemes.push(lexeme);
                    break;
                }
                lexemes.push(toUnknownLexeme(morpheme, "Unknown text"));
                break;
            case MorphemeCategory.Numeric:
                if (lexeme = retrieveQuantity(it)) {
                    lexemes.push(lexeme);
                    break;
                }
                lexemes.push(toUnknownLexeme(morpheme, "Unknown quantity"));
                break;
        }
    }
    /* eslint-enable no-cond-assign */
    return lexemes;
}