import { Distance, Duration, assignPercentage, fromKmPerHour } from '../../data/units';
import { FactorForRefSpeed, TrainingInterval, Training, MultiFactor } from '../../data/trainings';
import { Token, TokenPosition, rule, ParseError } from "typescript-parsec";
import { tok, seq, kleft, alt, opt, apply, rep_sc, list_sc, expectEOF } from "typescript-parsec";
import { Range } from "./morphemization";
import { LexemeKind, Lexeme, KeywordLexemeKind, NumericLexemeKind, UnknownLexemeKind } from "./lexemization";

export interface BaseFormulaToken {
    readonly margin: string,
    readonly text: string,
    readonly pos: TokenPosition,
    appropriate: boolean,
    next: FormulaToken | undefined,
};

export type NumericFormulaToken = BaseFormulaToken & {
    readonly kind: NumericLexemeKind,
    readonly value: number,
};

export type UnkownFormulaToken = BaseFormulaToken & {
    readonly kind: UnknownLexemeKind,
    readonly info: string,
};

export type KeywordFormulaToken = BaseFormulaToken & {
    readonly kind: KeywordLexemeKind,
};

export type FormulaToken = NumericFormulaToken | UnkownFormulaToken | KeywordFormulaToken;

function toTokenPosition(range: Range): TokenPosition {
    return {
        columnBegin: range.columnBegin,
        columnEnd: range.columnEnd,
        rowBegin: 0,
        rowEnd: 0,
        index: range.index,
    };
}

function toToken(lexeme: Lexeme) : FormulaToken {
    const common = {
        margin: lexeme.margin,
        text: lexeme.text,
        pos: toTokenPosition(lexeme.range),
        appropriate: true,
        next: undefined,
    };
    if ('value' in lexeme) {
        return {
            kind: lexeme.kind,
            value: lexeme.value,
            ...common
        };
    }
    else if ('info' in lexeme) {
        return {
            kind: UnknownLexemeKind.Unknown,
            info: lexeme.info,
            ...common
        };
    }
    return { kind: lexeme.kind, ...common };
}

function extractNumber(token: Token<NumericLexemeKind>): number {
    return (token as NumericFormulaToken).value;
}

function recategoriseAsSpeed(token: Token<NumericLexemeKind.Factor>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (token as any).kind = NumericLexemeKind.Speed;
}

const FACTOR_FOR_VMA = rule<LexemeKind, FactorForRefSpeed>();
const VARIABLE_FACTOR = rule<LexemeKind, MultiFactor>();
const INTERVAL = rule<LexemeKind, TrainingInterval>();
const RECOVERY = rule<LexemeKind, TrainingInterval>();
const INTERVAL_WITH_RECOVERY = rule<LexemeKind, TrainingInterval[]>();
const SEQUENCE = rule<LexemeKind, TrainingInterval[]>();
const REPEATED_SEQUENCE = rule<LexemeKind, Training>();
const TRAINING = rule<LexemeKind, Training>();

FACTOR_FOR_VMA.setPattern(
    apply(
        seq(
            tok(KeywordLexemeKind.Or as LexemeKind),
            tok(NumericLexemeKind.Factor),
            tok(KeywordLexemeKind.From),
            tok(NumericLexemeKind.Factor)
        ),
        ([_or, factor, _kw, vma]) => {
            recategoriseAsSpeed(vma);
            return {
                minRefSpeed: fromKmPerHour(extractNumber(vma)),
                factor: extractNumber(factor),
            };
        }
    )
);

VARIABLE_FACTOR.setPattern(
    apply(
        seq(tok(NumericLexemeKind.Factor), rep_sc(FACTOR_FOR_VMA)),
        ([factor, otherFactors]) => {
            const sortedFactors = otherFactors.slice();
            sortedFactors.sort((f1, f2) => f1.minRefSpeed.in_meter_per_sec - f2.minRefSpeed.in_meter_per_sec)
            return {
                defaultFactor: extractNumber(factor),
                otherFactors: sortedFactors,
            };
        }
    )
);

INTERVAL.setPattern(
    apply(
        seq(
            alt(tok(NumericLexemeKind.Duration), tok(NumericLexemeKind.Distance)),
            tok(KeywordLexemeKind.RunningAt as LexemeKind),
            tok(NumericLexemeKind.Speed)
        ),
        ([quantity, _at, speed]) => {
            const constraint: Distance | Duration = quantity.kind === NumericLexemeKind.Distance ?
                { in_meter: extractNumber(quantity) } :
                { in_sec: extractNumber(quantity) };
            return {
                speedPercentage: extractNumber(speed),
                constraint,
                isRecovery: false,
            };
        }
    )
);

RECOVERY.setPattern(
    apply(
        seq(
            tok(KeywordLexemeKind.Recovering as LexemeKind),
            alt(tok(NumericLexemeKind.Duration), tok(NumericLexemeKind.Distance)),
            opt(seq(tok(KeywordLexemeKind.RunningAt as LexemeKind), tok(NumericLexemeKind.Speed)))
        ),
        ([_rec, quantity, optSpeed]) => {
            const constraint: Distance | Duration = quantity.kind === NumericLexemeKind.Distance ?
                { in_meter: extractNumber(quantity) } :
                { in_sec: extractNumber(quantity) };
            return {
                speedPercentage: optSpeed === undefined ? assignPercentage("vf") : extractNumber(optSpeed[1]),
                constraint,
                isRecovery: true,
            };
        }
    )
);

INTERVAL_WITH_RECOVERY.setPattern(
    apply(
        seq(INTERVAL, opt(RECOVERY)),
        ([interval, optRecovery]) => {
            if (optRecovery === undefined)
                return [interval];
            return [interval, optRecovery];
        }
    )
);

SEQUENCE.setPattern(
    apply(
        seq(
            tok(KeywordLexemeKind.OParens),
            list_sc(INTERVAL_WITH_RECOVERY, tok(KeywordLexemeKind.Then)),
            tok(KeywordLexemeKind.CParens)
        ),
        ([_op, intervalsWithRecoveries, _cp]) => {
            return intervalsWithRecoveries.flatMap(i => i);
        }
    )
);

REPEATED_SEQUENCE.setPattern(
    apply(
        seq(
            VARIABLE_FACTOR,
            tok(KeywordLexemeKind.Times),
            alt(INTERVAL, SEQUENCE),
            opt(RECOVERY),
        ),
        ([multiFactor, _times, intervalOrSeq, optRecovery]) => {
            const intervals: TrainingInterval[] =
                Array.isArray(intervalOrSeq) ?
                intervalOrSeq :
                [intervalOrSeq];
            const training: Training = [{ multiFactor, intervals }];
            if (optRecovery !== undefined)
                training.push(optRecovery);
            return training;
        }
    )
);

TRAINING.setPattern(
    apply(
        kleft(
            list_sc(
                alt(INTERVAL_WITH_RECOVERY, REPEATED_SEQUENCE),
                tok(KeywordLexemeKind.Then)
            ),
            opt(tok(KeywordLexemeKind.Then))
        ),
        (alternatives) => alternatives.flatMap(a => a),
    )
);

export interface Formula {
    firstToken: FormulaToken | undefined,
    training: Training | undefined,
};

function markAsNonAppropriate(tokens: ReadonlyArray<FormulaToken>, error: ParseError | undefined) {
    if (error?.pos !== undefined) {
        const errorIndex = error.pos.index;
        const failedToken = tokens.find(t => t.pos.index === errorIndex);
        if (failedToken !== undefined) {
            failedToken.appropriate = false;
        }
    } else {
        const lastToken = tokens.at(-1)
        if (lastToken !== undefined) {
            lastToken.appropriate = false;
        }
    }
}

export function parse(lexemes: ReadonlyArray<Lexeme>): Formula {
    const tokens: FormulaToken[] = [];
    let previousToken: FormulaToken | undefined = undefined;
    for(const lexeme of lexemes) {
        const token = toToken(lexeme);
        tokens.push(token);
        if (previousToken !== undefined)
            previousToken.next = token;
        previousToken = token;
    }
    const firstToken = tokens.at(0);
    const parsingOutput = expectEOF(TRAINING.parse(firstToken));
    if (parsingOutput.successful && 0 < parsingOutput.candidates.length) {
        return {firstToken, training: parsingOutput.candidates[0].result};
    } else {
        markAsNonAppropriate(tokens, parsingOutput.error);
        return {firstToken, training: undefined};
    }
}
