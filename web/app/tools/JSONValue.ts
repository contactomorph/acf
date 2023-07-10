export type JSONValue =
    | null
    | boolean
    | number
    | string
    | ReadonlyArray<JSONValue>
    | JSONObject;

export interface JSONObject {
    readonly [x: string]: JSONValue;
}