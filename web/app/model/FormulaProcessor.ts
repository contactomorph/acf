import { morphemize } from "./grammar/morphemization";
import { lexemize } from "./grammar/lexemization";
import { parse, Formula } from "./grammar/parsing";

export async function processFormula(text: string): Promise<Formula> {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const morphemes = morphemize(text);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const lexemes = lexemize(morphemes);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    return parse(lexemes);
}
