import { processFormula } from "../app/model/FormulaProcessor";
import { computeIntervals } from "../app/model/interval_computation";
import { encodeGarminWorkout } from "../app/model/GarminWorkoutEncoder";
import { fromKmPerHour, Speed } from "../app/data/units";

// Table de calcul du CRC-16 FIT (identique à celle de l'encodeur).
const CRC_TABLE = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
    0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
];

function updateCrc(crc: number, byte: number): number {
    let tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[byte & 0xf];
    tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xf];
    return crc & 0xffff;
}

function computeCrc(bytes: Uint8Array): number {
    let crc = 0;
    for (const byte of bytes) crc = updateCrc(crc, byte);
    return crc;
}

function makeSpeedSpecifier(refKmH: number): (percentage: number) => Speed {
    return (percentage: number) => fromKmPerHour((percentage / 100) * refKmH);
}

function buildFit(formula: string, refKmH: number): Uint8Array {
    const training = processFormula(formula).training;
    const intervals = computeIntervals(training, makeSpeedSpecifier(refKmH));
    return encodeGarminWorkout(formula, intervals);
}

test('FIT header is well formed', () => {
    const bytes = buildFit("3 * 400m à 100% recup 1min", 15);

    expect(bytes[0]).toBe(14); // taille de l'en-tête
    expect(bytes[1]).toBe(0x20); // version du protocole
    // Signature ".FIT" aux octets 8-11.
    expect(String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])).toBe(".FIT");

    const dataSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
    // Longueur totale = en-tête (14) + données + CRC final (2).
    expect(bytes.length).toBe(14 + dataSize + 2);
});

test('FIT header and file CRC are valid', () => {
    const bytes = buildFit("2 * 1000m à 90% recup 2min", 16);

    const headerCrc = bytes[12] | (bytes[13] << 8);
    expect(computeCrc(bytes.slice(0, 12))).toBe(headerCrc);

    const fileCrc = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
    expect(computeCrc(bytes.slice(0, bytes.length - 2))).toBe(fileCrc);
});

test('FIT declares the correct number of workout steps', () => {
    const formula = "4 * (300m à 100%, 100m à 94% recup 1min) recup 3min, 2km à 87%";
    const training = processFormula(formula).training;
    const intervals = computeIntervals(training, makeSpeedSpecifier(15));
    const bytes = encodeGarminWorkout(formula, intervals);

    // Signature de la définition du message workout (global 26 = 0x1A) avec 3
    // champs : 0x41 (def, local 1), 0x00 (réservé), 0x00 (little endian),
    // 0x1A 0x00 (numéro de message), 0x03 (nombre de champs).
    const signature = [0x41, 0x00, 0x00, 0x1a, 0x00, 0x03];
    let defStart = -1;
    for (let i = 0; i <= bytes.length - signature.length; ++i) {
        if (signature.every((value, k) => bytes[i + k] === value)) {
            defStart = i;
            break;
        }
    }
    expect(defStart).toBeGreaterThanOrEqual(0);

    // Après la définition (6 octets fixes + 3 champs × 3 octets = 15 octets),
    // le message de données commence par 0x01, puis sport (1 octet), puis
    // num_valid_steps (uint16).
    const dataStart = defStart + 6 + 3 * 3;
    expect(bytes[dataStart]).toBe(0x01);
    const stepCount = bytes[dataStart + 2] | (bytes[dataStart + 3] << 8);
    expect(stepCount).toBe(intervals.length);
});
