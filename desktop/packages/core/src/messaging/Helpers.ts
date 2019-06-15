import * as $protobuf from "protobufjs"
import { stato } from "@stato/models"

//import PayloadType = stato.PayloadType
import { isFunction, isString } from "typeguard"
import { Option } from "prelude-ts"
import { Payload } from "rsocket-types"

export type Envelope = stato.Envelope
export type IEnvelope = stato.IEnvelope
export type IEnvelopePayload = stato.IEnvelopePayload
//export type PayloadType = Models.PayloadType


export type ProtoOrString = ProtoMessage | string | undefined

export type ProtoMessageType<Type extends stato.PayloadType> =
  Type extends stato.PayloadType.PayloadTypePluginList
    ? stato.PluginListResponse
    : Type extends stato.PayloadType.PayloadTypePluginCall
    ? stato.PluginCallRequestResponse
    : Type extends stato.PayloadType.PayloadTypeError
      ? stato.ErrorRequestResponse
      : Type extends stato.PayloadType.PayloadTypePluginSetActive
        ? stato.PluginSetActiveRequestResponse // ConnectionMetadata
        : Type extends stato.PayloadType.PayloadTypeCertificateExchange
          ? stato.CertificateExchangeRequest
          : Type extends string
            ? any
            : never

export function dataToArray(data:any):string {
  return !data ?"{}" : isString(data) ? data : JSON.stringify(isFunction(data.toJSON) ? data.toJSON() : data)
}


export interface ProtoMessage extends Object {
  toJSON():{ [k:string]:any }
}

export type ProtoMessageConstructor<T extends ProtoMessage = any> = {
  new(json?:any):T
  decode(reader:($protobuf.Reader | Uint8Array), length?:number):T
  encode(message:T, writer?:$protobuf.Writer):$protobuf.Writer
  create(properties?:T):T
}

export function createEnvelope(
  envelope:Partial<stato.IEnvelope> = {}
):stato.Envelope {
  return stato.Envelope.create(envelope)
}

export function createEnvelopePayload(envelopePayload:Partial<stato.IEnvelopePayload> = {}):stato.EnvelopePayload {
  return stato.EnvelopePayload.create(envelopePayload)
}

export function createEnvelopeWithPayloadData<Type extends stato.PayloadType>(
  type:Type,
  proto:ProtoOrString
) {
  return Option.of(createEnvelope())
    .map(envelope => Object.assign(envelope, {
      payload: createEnvelopePayload({
        type,
        body: dataToArray(proto)
      })
    }))
    .getOrThrow()
}

export function encodeProto(proto:ProtoOrString | undefined):Uint8Array {
  return !proto ?
    Uint8Array.of() :
    isString(proto) ?
      Uint8Array.from(Buffer.from(proto)) :
      (Object.getPrototypeOf(proto as any) as ProtoMessageConstructor)
        .encode(proto)
        .finish()
  
}


export function toPayload(envelope:stato.Envelope, payloadBody:any):Payload<Uint8Array, Uint8Array> {
  if (payloadBody) {
    if (!envelope.payload) {
      envelope.payload = stato.EnvelopePayload.create()
    }
    
    envelope.payload.body = isString(payloadBody) ? payloadBody : JSON.stringify(payloadBody)
  }
  return {
    data: stato.Envelope.encode(envelope).finish(),
    metadata: Uint8Array.of()
  }
}
