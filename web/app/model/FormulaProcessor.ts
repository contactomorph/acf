import { morphemize } from "./grammar/morphemization";
import { lexemize } from "./grammar/lexemization";
import { parse, Formula } from "./grammar/parsing";

export function processFormula(text: string): Formula {
    const morphemes = morphemize(text);
    const lexemes = lexemize(morphemes);
    return parse(lexemes);
}
