/** Message instance operations retained by protobuf-es 1.10.1 in the supplied bundle. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [name: string]: JsonValue };
export interface JsonReadOptions { ignoreUnknownFields?: boolean; }
export interface JsonWriteOptions {
  emitDefaultValues?: boolean;
  enumAsInteger?: boolean;
  useProtoFieldName?: boolean;
  prettySpaces?: number;
}
export interface BinaryReadOptions { readUnknownFields?: boolean; }
export interface BinaryWriteOptions { writeUnknownFields?: boolean; }
/** Recursive initPartial input; data fields only, preserving oneof case/value coupling. */
export type MessageInit<T> = T extends Uint8Array ? T
  : T extends readonly (infer E)[] ? MessageInit<E>[]
  : T extends ProtoMessage ? { [K in Exclude<keyof T, keyof ProtoMessage>]?: MessageInit<T[K]> }
  : T extends { case: undefined } ? T
  : T extends { case: infer C; value: infer V } ? { case: C; value: MessageInit<V> }
  : T extends object ? { [K in keyof T]?: MessageInit<T[K]> }
  : T;
export declare class ProtoMessage {
  clone(): this;
  fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): this;
  fromJson(value: JsonValue, options?: JsonReadOptions): this;
  fromJsonString(value: string, options?: JsonReadOptions): this;
  toBinary(options?: BinaryWriteOptions): Uint8Array;
  toJson(options?: JsonWriteOptions): JsonValue;
  toJsonString(options?: JsonWriteOptions): string;
}
