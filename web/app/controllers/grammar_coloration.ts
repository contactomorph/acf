import { KeywordLexemeKind, LexemeKind, NumericLexemeKind, UnknownLexemeKind } from "../model/grammar/lexemization";
import { FormulaToken } from "../model/grammar/parsing";
import { colorizeSpeed } from '../components/unit_display';

const KEYWORD_STYLE: Partial<React.CSSProperties> = {
    backgroundColor: undefined,
    color: "blue",
};

export const DISTANCE_COLOR_NAME = "darkmagenta";
export const DURATION_COLOR_NAME = "darkcyan";
export const DISTANCE_BCOLOR_NAME = "pink";
export const DURATION_BCOLOR_NAME = "lightcyan";

const CATEGORY_TO_PROPS: Map<LexemeKind, Partial<React.CSSProperties>> =
    new Map<LexemeKind, Partial<React.CSSProperties>>(
    [
        [
            UnknownLexemeKind.Unknown, {
                color: "darkred",
                textDecoration: "underline red",
                textDecorationStyle: "wavy"
            } as Partial<React.CSSProperties>
        ],
        [KeywordLexemeKind.Recovering, KEYWORD_STYLE],
        [KeywordLexemeKind.RunningAt, KEYWORD_STYLE],
        [KeywordLexemeKind.Or, KEYWORD_STYLE],
        [KeywordLexemeKind.From, KEYWORD_STYLE],
        [KeywordLexemeKind.Times, KEYWORD_STYLE],
        [KeywordLexemeKind.Then, KEYWORD_STYLE],
        [NumericLexemeKind.Factor,{ backgroundColor: "#CFC3C3", color: "#3F3939" }],
        [NumericLexemeKind.Distance, { backgroundColor: DISTANCE_BCOLOR_NAME, color: DISTANCE_COLOR_NAME }],
        [NumericLexemeKind.Duration, { backgroundColor: DURATION_BCOLOR_NAME, color: DURATION_COLOR_NAME}],
    ]);
    
type ColoredSpan = Partial<React.CSSProperties> & { textWidth: number };

export function toColoredSpans(token: FormulaToken | undefined) : ReadonlyArray<ColoredSpan> {
    const spans: ColoredSpan[] = [];
    while(token !== undefined) {
        let partialspan = CATEGORY_TO_PROPS.get(token.kind);
        if (token.kind === NumericLexemeKind.Speed) {
            const color = colorizeSpeed(token.value);
            partialspan = {
                backgroundColor: color.brighten().hex(),
                color: color.darken(2).hex(),
            };
        }
        const span = {
            textWidth: token.text.length,
            color: "black",
            borderRadius: "3px",
            ...partialspan,
        };
        if (!token.appropriate && token.kind !== UnknownLexemeKind.Unknown) {
            span.textDecoration = "underline red";
            span.textDecorationStyle = "wavy";
        }
        if (0 < token.margin.length) {
            spans.push({textWidth: token.margin.length});
        }
        spans.push(span);
        token = token.next;
    }
    return spans;
}
