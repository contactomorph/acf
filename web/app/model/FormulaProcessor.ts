import { morphemize } from "./grammar/morphemization";
import { lexemize } from "./grammar/lexemization";
import { parse, Formula } from "./grammar/parsing";
import { Future } from "../tools/Future";

export async function processFormula(text: string): Promise<Formula> {
    await Future.pause();
    const morphemes = morphemize(text);
    await Future.pause();
    const lexemes = lexemize(morphemes);
    await Future.pause();
    return parse(lexemes);
}
