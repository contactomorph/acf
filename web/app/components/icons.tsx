export const NBS = '\u00A0';
export const ARROW = '\u2192';
export const RULER = '\uD83D\uDCCF';
export const CHRONO = '\u23F1\uFE0F';
export const SHOES = '\uD83D\uDC5F';

const RUNNER = "\uD83C\uDFC3";
const LOTUS = "	\uD83E\uDDD8";

const SKINS = [undefined, '\uD83C\uDFFB', '\uD83C\uDFFC', '\uD83C\uDFFD', '\uD83C\uDFFE', '\uD83C\uDFFF'];

const GENDERS = [undefined, '\u2642', '\u2640'];

function addGenderAndSkin(base: string, skin: string | undefined, gender: string | undefined): string {
    const prefix = skin === undefined ? base : `${base}${skin}`;
    return gender === undefined ? prefix : `${prefix}\u200D${gender}\uFE0F`;
}

export function getIcon(isRecovery: boolean): string {
    const r = Math.floor(24 * Math.random());
    const s = r % 6;
    const g = Math.floor(r / 6);
    const b = isRecovery ? LOTUS : RUNNER;
    return addGenderAndSkin(b, SKINS[s], GENDERS[g]);
}
