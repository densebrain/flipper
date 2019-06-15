/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { isDevicePlugin, Plugin } from "@stato/core"
import { getLogger, Pair, Quad } from "@stato/common"

import { getValue } from "typeguard"

import { setPluginState } from "../reducers/PluginStatesReducer"
import { reportPlatformFailures } from "../utils/metrics"

import { Messenger } from "./Messenger"
import * as UUID from "uuid"
import { Option } from "prelude-ts"

import { stato } from "@stato/models"
import {
  Envelope,
  IEnvelopePayload, ProtoMessage,
  ProtoMessageType
} from "./Helpers"
import { Payload } from "rsocket-types"
import { ProtoMessageConstructor } from "./Helpers"

const log = getLogger(__filename),
  invariant = require("invariant")

export class EmptyMessagePayload {
  constructor(patch: Partial<EmptyMessagePayload>) {
    Object.assign(this, patch)
  }
}


/**
 * Message handler type
 */
export type MessageHandler<
  Type extends stato.PayloadType,
  Message extends ProtoMessageType<Type> = ProtoMessageType<Type>
> = (
  client: Messenger,
  msg: Message,
  payload: IEnvelopePayload,
  envelope: Envelope
) => Promise<any>

export function makeTransformHandler<
  Type extends stato.PayloadType,
  Message extends ProtoMessageType<Type> = ProtoMessageType<Type>
>(
  fn: (
    msg: Message,
    payload: stato.EnvelopePayload,
    envelope: stato.Envelope
  ) => any
): MessageHandler<Type, Message> {
  return async (
    _client: Messenger,
    msg: Message,
    payload: stato.EnvelopePayload,
    envelope: stato.Envelope
  ): Promise<any> => {
    return await fn(msg, payload, envelope)
  }
}

export type MessageHandlerConfig<Type extends stato.PayloadType = any> = Quad<
  MessageHandler<Type>,
  stato.Envelope,
  IEnvelopePayload,
  ProtoMessageType<Type>
>

export type MessageHandlerEntry<
  Type extends stato.PayloadType,
  Handler extends MessageHandler<Type,ProtoMessageType<Type>> = MessageHandler<Type,ProtoMessageType<Type>>
> =
  [Type, [ProtoMessageConstructor<ProtoMessageType<Type>>, Handler]]

const messageHandlers = new Map(Array<MessageHandlerEntry<any,any>>(
  [stato.PayloadType.PayloadTypePluginList, [
    stato.PluginListResponse,
    async (
      _client: Messenger,
      msg: stato.PluginListResponse,
      _payload: stato.EnvelopePayload,
      _envelope: stato.Envelope
    ) => {
      return msg.plugins
    }
  ]],
  [stato.PayloadType.PayloadTypePluginCall, [
    stato.PluginCallRequestResponse,
    async (
      client: Messenger,
      msg: stato.PluginCallRequestResponse,
      _payload: stato.EnvelopePayload,
      _envelope: stato.Envelope
    ) => {
      invariant(msg, "expected params")

      const { pluginId, method } = msg,
        state = client.getState(),
        persistingPlugin: Plugin | null | undefined =
          state.plugins.clientPlugins.get(pluginId) ||
          state.plugins.devicePlugins.get(pluginId),
        persistingComponentClazz = getValue(
          () => persistingPlugin!!.componentClazz
        )

      log.info(
        "Preparing to execute response",
        msg,
        _envelope,
        persistingComponentClazz
      )
      if (persistingComponentClazz.persistedStateReducer) {
        let pluginKey = `${client.id}#${pluginId}` //$FlowFixMe

        // For device plugins, we are just using the device id instead of client id as the prefix.
        if (isDevicePlugin(persistingPlugin)) {
          pluginKey = `${getValue(() => client.getDevice()!!.serial) ||
            ""}#${pluginId}`
        }

        const persistedState = {
            ...(persistingComponentClazz.defaultPersistedState || {}),
            ...client.getState().pluginStates[pluginKey]
          },
          newPluginState = persistingComponentClazz.persistedStateReducer(
            persistedState,
            msg
          )

        log.debug(`Executing ${pluginKey}`, msg, persistedState, newPluginState)

        if (persistedState !== newPluginState) {
          client.getStore().dispatch(
            setPluginState({
              pluginKey,
              state: newPluginState
            })
          )
        }
      } else {
        const apiCallbacks = client.broadcastCallbacks.get(pluginId),
          methodCallbacks: Set<Function> | null | undefined = getValue(
            () => apiCallbacks.get(method),
            new Set()
          )

        log.info("Responding to execute with", msg, _envelope, apiCallbacks)
        const value = getValue(
          () => JSON.parse(msg.body),
          {}
        )
        methodCallbacks.forEach(fn => fn(value))
        return value
      }
      return {}
    }
  ]],

  [stato.PayloadType.PayloadTypeCertificateExchange, [
    stato.CertificateExchangeRequest,
    async (
      client: Messenger,
      msg: stato.CertificateExchangeRequest,
      _payload: stato.EnvelopePayload,
      _envelope: stato.Envelope
    ) => {
      const { csr } = msg
      try {
        const result = await reportPlatformFailures(
          client
            .getCertificateProvider()
            .processCertificateSigningRequest(
              client.getConnectionId() || UUID.v4(),
              csr
            ),
          "processCertificateSigningRequest"
        )

        client.emit("finish-client-setup", {
          client,
          connectionId: result.connectionId
        })

        // client.toPayload(
        //   Object.assign(_.clone(envelope), {
        //     payload: result
        //   }).encode()
        // )
        return result
      } catch (ex) {
        client.emit("client-setup-error", {
          client,
          error: ex
        })

        throw ex
      }
    }
  ]],
  [stato.PayloadType.PayloadTypePluginSetActive, [
    stato.PluginSetActiveRequestResponse,
    makeTransformHandler<stato.PayloadType.PayloadTypePluginSetActive>(msg => msg)
  ]],
  [stato.PayloadType.PayloadTypeError, [
    stato.ErrorRequestResponse,
    async (
      _client: Messenger,
      msg: stato.ErrorRequestResponse,
      _payload: stato.EnvelopePayload,
      _envelope: stato.Envelope
    ) => {
      const { message, stacktrace, name } = msg
      log.error(`Received failed response (${name}): ${message}\n${stacktrace}`)
    }
  ]]))


export function envelopFromPayload(
  socketPayload: Payload<Uint8Array, Uint8Array>
): MessageHandlerConfig {
  log.info("envelopeFromPayload", socketPayload)
  const envelope = stato.Envelope.decode(socketPayload.data as Uint8Array)
  
  log.info("parsed envelope", envelope)
  const
    {payload} = envelope,
    [PayloadType, handler] = getMessageHandler(payload.type),
    message = stringToMessage(PayloadType, payload.body)
  
  return [handler, envelope, payload, message]
}

// export function toEnvelope<
//   T,
//   F extends ProtoMessageConstructor<T> = EnvelopePayloadConstructor<T>
// >(type: F, encoded: EncodedEnvelope): ReadyEnvelope<T> {
//   return new ReadyEnvelope<T>({
//     ...encoded,
//     payload: new type(
//       isString(encoded.payload) ? JSON.parse(encoded.payload) : encoded.payload
//     )
//   })
// }

export function getMessageHandler<Type extends stato.PayloadType>(
  type: Type
): Pair<ProtoMessageConstructor<ProtoMessageType<Type>>, MessageHandler<Type, any>> {
  const result = messageHandlers.get(type)
  if (!result)
    throw new Error(`Unable to find handler for ${stato.PayloadType[type]}`)
  return result
}

export function handleMessage<R = any>(
  client: Messenger,
  envelope: Envelope
): Option<Promise<void | R>> {
  const {payload} = envelope,
    {type} = payload
  
  return Option.of(getMessageHandler(type)).match({
    None: () => {
      log.error("Unable to handle", type, envelope)
      throw new Error("Unable to handle message")
    },
    Some: ([Type, handler]: Pair<
      ProtoMessageConstructor<any>,
      MessageHandler<any,any>
    >) =>
      Option.of(handler(client, stringToMessage(Type, envelope.payload.body) , payload, envelope))
  })
}


export function stringToMessage<T extends ProtoMessage>(Type: ProtoMessageConstructor<T>, data: string):T {
  // const
  //   dataBuf = Buffer.from(data),
  //   dataStr = String.fromCharCode(...dataBuf)
  try {
    log.info("Convert string to message", data)
    return new Type(data && data.length ? JSON.parse(data) : {})
  } catch (err) {
    log.error("Unable to send", err)
    throw err
  }
}
