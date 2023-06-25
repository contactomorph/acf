import { morphemize } from "./morphemization";
import { lexemize } from "./lexemization";
import { parse, Formula } from "./parsing";

export async function processFormula(text: string): Promise<Formula> {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const morphemes = morphemize(text);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const lexemes = lexemize(morphemes);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    return parse(lexemes);
}
