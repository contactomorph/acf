import { CompleteInterval } from "../data/intervals";

// Encodeur de fichiers FIT « workout » (entrainement structuré) compatibles
// avec les montres Garmin. Le format FIT est un format binaire documenté par
// Garmin ; on n'implémente ici que le strict nécessaire pour décrire une
// séance : une suite d'étapes (workout_step) avec une contrainte de durée ou
// de distance et une cible d'allure (vitesse).
//
// Références des valeurs (profil FIT) :
//   - file_id.type : workout = 5
//   - workout.sport : running = 1
//   - wkt_step_duration : time = 0, distance = 1
//   - wkt_step_target : speed = 0
//   - intensity : active = 0, rest = 1

// Numéros de messages globaux du profil FIT.
const MESG_FILE_ID = 0;
const MESG_WORKOUT = 26;
const MESG_WORKOUT_STEP = 27;

// Types de base FIT (bit 7 = little endian pour les entiers multi-octets).
const BASE_ENUM = 0x00;
const BASE_UINT16 = 0x84;
const BASE_UINT32 = 0x86;
const BASE_UINT32Z = 0x8c;
const BASE_STRING = 0x07;

// Décalage entre l'epoch FIT (1989-12-31 00:00:00 UTC) et l'epoch Unix.
const FIT_EPOCH_OFFSET = 631065600;

const SPORT_RUNNING = 1;
const DURATION_TIME = 0;
const DURATION_DISTANCE = 1;
const TARGET_SPEED = 0;
const INTENSITY_ACTIVE = 0;
const INTENSITY_REST = 1;

// Largeur de la fourchette d'allure autour de la vitesse cible (±3 %).
const SPEED_BAND = 0.03;

// Encode une chaine en octets UTF-8, sans dépendre de TextEncoder (absent de
// certains environnements d'exécution comme jsdom en test).
function utf8Bytes(text: string): number[] {
    const out: number[] = [];
    for (const char of text) {
        const code = char.codePointAt(0)!;
        if (code < 0x80) {
            out.push(code);
        } else if (code < 0x800) {
            out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        } else if (code < 0x10000) {
            out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        } else {
            out.push(
                0xf0 | (code >> 18),
                0x80 | ((code >> 12) & 0x3f),
                0x80 | ((code >> 6) & 0x3f),
                0x80 | (code & 0x3f),
            );
        }
    }
    return out;
}

class ByteWriter {
    private readonly bytes: number[] = [];

    get length(): number {
        return this.bytes.length;
    }

    u8(value: number): void {
        this.bytes.push(value & 0xff);
    }

    u16(value: number): void {
        this.bytes.push(value & 0xff);
        this.bytes.push((value >>> 8) & 0xff);
    }

    u32(value: number): void {
        this.bytes.push(value & 0xff);
        this.bytes.push((value >>> 8) & 0xff);
        this.bytes.push((value >>> 16) & 0xff);
        this.bytes.push((value >>> 24) & 0xff);
    }

    // Chaine encodée en UTF-8, complétée par des zéros jusqu'à `size` octets.
    fixedString(text: string, size: number): void {
        const encoded = utf8Bytes(text);
        for (let i = 0; i < size; ++i) {
            this.bytes.push(i < encoded.length ? encoded[i] : 0);
        }
    }

    toUint8Array(): Uint8Array {
        return Uint8Array.from(this.bytes);
    }
}

// Table de calcul du CRC-16 utilisé par le format FIT.
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
    for (const byte of bytes) {
        crc = updateCrc(crc, byte);
    }
    return crc;
}

interface FieldDef {
    readonly number: number;
    readonly size: number;
    readonly baseType: number;
}

// Écrit un enregistrement de définition (décrit la structure des messages
// suivants qui partagent le même « local message type »).
function writeDefinition(
    writer: ByteWriter,
    localType: number,
    globalMesg: number,
    fields: ReadonlyArray<FieldDef>,
): void {
    writer.u8(0x40 | localType); // en-tête de définition
    writer.u8(0); // réservé
    writer.u8(0); // architecture : 0 = little endian
    writer.u16(globalMesg);
    writer.u8(fields.length);
    for (const field of fields) {
        writer.u8(field.number);
        writer.u8(field.size);
        writer.u8(field.baseType);
    }
}

function nameSize(text: string): number {
    // +1 pour garder un octet nul terminal.
    return utf8Bytes(text).length + 1;
}

interface StepPlan {
    readonly durationType: number;
    readonly durationValue: number;
    readonly speedLow: number;
    readonly speedHigh: number;
    readonly intensity: number;
}

function planStep(interval: CompleteInterval): StepPlan {
    let durationType: number;
    let durationValue: number;
    if (interval.from === "distance") {
        durationType = DURATION_DISTANCE;
        durationValue = Math.round(interval.distance.in_meter * 100); // centimètres
    } else {
        durationType = DURATION_TIME;
        durationValue = Math.round(interval.duration.in_sec * 1000); // millisecondes
    }
    const speed = interval.speed.in_meter_per_sec;
    const speedLow = Math.max(0, Math.round(speed * (1 - SPEED_BAND) * 1000)); // mm/s
    const speedHigh = Math.round(speed * (1 + SPEED_BAND) * 1000); // mm/s
    return {
        durationType,
        durationValue,
        speedLow,
        speedHigh,
        intensity: interval.isRecovery ? INTENSITY_REST : INTENSITY_ACTIVE,
    };
}

// Construit un fichier FIT « workout » (spécifique à Garmin) à partir d'une
// liste d'intervalles (déjà calculés pour une VMA de référence) et d'un nom de
// séance.
export function encodeGarminWorkout(
    name: string,
    intervals: ReadonlyArray<CompleteInterval>,
): Uint8Array {
    const safeName = name.trim().length === 0 ? "Séance" : name.trim();
    const wktNameSize = nameSize(safeName);
    const steps = intervals.map(planStep);

    const body = new ByteWriter();

    // --- Message file_id (local type 0) ---
    writeDefinition(body, 0, MESG_FILE_ID, [
        { number: 0, size: 1, baseType: BASE_ENUM }, // type
        { number: 1, size: 2, baseType: BASE_UINT16 }, // manufacturer
        { number: 2, size: 2, baseType: BASE_UINT16 }, // product
        { number: 3, size: 4, baseType: BASE_UINT32Z }, // serial_number
        { number: 4, size: 4, baseType: BASE_UINT32 }, // time_created
    ]);
    body.u8(0x00); // en-tête de données local 0
    body.u8(5); // type = workout
    body.u16(255); // manufacturer = development
    body.u16(0); // product
    body.u32(0); // serial_number (invalide pour uint32z)
    body.u32(Math.floor(Date.now() / 1000) - FIT_EPOCH_OFFSET); // time_created

    // --- Message workout (local type 1) ---
    writeDefinition(body, 1, MESG_WORKOUT, [
        { number: 4, size: 1, baseType: BASE_ENUM }, // sport
        { number: 6, size: 2, baseType: BASE_UINT16 }, // num_valid_steps
        { number: 8, size: wktNameSize, baseType: BASE_STRING }, // wkt_name
    ]);
    body.u8(0x01); // en-tête de données local 1
    body.u8(SPORT_RUNNING);
    body.u16(steps.length);
    body.fixedString(safeName, wktNameSize);

    // --- Messages workout_step (local type 2) ---
    writeDefinition(body, 2, MESG_WORKOUT_STEP, [
        { number: 254, size: 2, baseType: BASE_UINT16 }, // message_index
        { number: 1, size: 1, baseType: BASE_ENUM }, // duration_type
        { number: 2, size: 4, baseType: BASE_UINT32 }, // duration_value
        { number: 3, size: 1, baseType: BASE_ENUM }, // target_type
        { number: 4, size: 4, baseType: BASE_UINT32 }, // target_value
        { number: 5, size: 4, baseType: BASE_UINT32 }, // custom_target_value_low
        { number: 6, size: 4, baseType: BASE_UINT32 }, // custom_target_value_high
        { number: 7, size: 1, baseType: BASE_ENUM }, // intensity
    ]);
    let index = 0;
    for (const step of steps) {
        body.u8(0x02); // en-tête de données local 2
        body.u16(index);
        body.u8(step.durationType);
        body.u32(step.durationValue);
        body.u8(TARGET_SPEED);
        body.u32(0); // target_value = 0 -> on utilise la fourchette custom
        body.u32(step.speedLow);
        body.u32(step.speedHigh);
        body.u8(step.intensity);
        ++index;
    }

    const dataBytes = body.toUint8Array();

    // --- En-tête de fichier (14 octets) ---
    const header = new ByteWriter();
    header.u8(14); // taille de l'en-tête
    header.u8(0x20); // version du protocole 2.0
    header.u16(2140); // version du profil
    header.u32(dataBytes.length); // taille des données
    header.fixedString(".FIT", 4);
    const headerBytes = header.toUint8Array();
    const headerCrc = computeCrc(headerBytes);

    // Assemblage final : en-tête + CRC en-tête + données + CRC global.
    const out = new ByteWriter();
    for (const byte of headerBytes) out.u8(byte);
    out.u16(headerCrc);
    for (const byte of dataBytes) out.u8(byte);
    const fileCrc = computeCrc(out.toUint8Array());
    out.u16(fileCrc);

    return out.toUint8Array();
}
