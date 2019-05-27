import { Encodable } from "rsocket-types"

/**
 * A Serializer transforms data between the application encoding used in
 * Payloads and the Encodable type accepted by the transport client.
 */

export type Serializer<T> = {
  deserialize: (data: Encodable | null | undefined) => T | null | undefined
  serialize: (data: T | null | undefined) => Encodable | null | undefined
}
export type PayloadSerializers<D, M> = {
  data: Serializer<D>
  metadata: Serializer<M>
} // JSON serializer

export const JsonSerializer: Serializer<any>

export type SerializerType = 'data' | 'metadata'
export const JsonSerializers:{[key in SerializerType]: Serializer<any> }

export const IdentitySerializer: Serializer<Encodable>
export const IdentitySerializers:{[key in SerializerType]: Serializer<Encodable> }
