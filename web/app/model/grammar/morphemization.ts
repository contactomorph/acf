export enum MorphemeCategory {
    Text,
    Numeric,
    Sigil,
}

export interface Range {
    readonly columnBegin: number,
    readonly columnEnd: number,
    readonly index: number,
};

class MorphemePositioner {
    private _columnBegin: number;
    private _columnEnd: number;
    private _index: number;
    public constructor() {
        this._columnBegin = this._columnEnd = this._index = 0;
    }
    public extend() {
        this._columnEnd++;
    }

    public produce(): Range {
        const range = {
            columnBegin: this._columnBegin,
            columnEnd: this._columnEnd,
            index: this._index,
        };
        this._columnEnd++;
        this._columnBegin = this._columnEnd;
        this._index++;
        return range;
    }
}

export interface Morpheme {
    mode: MorphemeCategory,
    margin: string,
    content: string,
    range: Range,
};

export function morphemize(text: string): ReadonlyArray<Morpheme> {
    const morphemes: Array<Morpheme> = [];
    let chars: string[] = [];
    const positioner = new MorphemePositioner();
    let previousMode: MorphemeCategory | null = null;
    let margin = "";
    for(const c of text) {
        const nextMode = getCategory(c);
        if (nextMode === previousMode && previousMode !== MorphemeCategory.Sigil) {
            positioner.extend();
            chars.push(c);
        } else {
            const range = positioner.produce();
            if (previousMode === null) {
                margin = chars.join("");
            } else {
                if (0 < chars.length)  {
                    const content = chars.join("").toLowerCase();
                    morphemes.push({ mode: previousMode, margin, content, range, });
                }
                margin = "";
            }
            chars = [c];
            previousMode = nextMode;
        }
    }
    const range = positioner.produce();
    if (0 < chars.length && previousMode !== null)  {
        const content = chars.join("").toLowerCase();
        morphemes.push({ mode: previousMode, margin, content, range, });
    }
    return morphemes;
}

function getCategory(c: string): MorphemeCategory | null {
    if (c === " " || c === '\n' || c === '\r' || c === '\t')
        return null;
    if (c === "(" || c === ')' || c === ',' || c === '|' || c === '*')
        return MorphemeCategory.Sigil;
    if ("0" <= c && c <= "9")
        return MorphemeCategory.Numeric;
    return MorphemeCategory.Text;
}