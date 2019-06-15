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
import BaseDevice from "../devices/BaseDevice"
import { RootState } from "../reducers"
import CertificateProvider from "../utils/CertificateProvider"
import { MessageChannelEvents } from "./MessageChannelEvents"
import { Payload } from "rsocket-types"
import { stato as Models } from "@stato/models"
import { dataToArray, Envelope } from "./Helpers"
import { Option } from "prelude-ts"


const EventEmitter = require("events") as any

export abstract class Messenger extends EventEmitter {
  id: string = ""

  getSDKState(): Partial<Models.SDKState> {
    return {}
  }
  
  protected constructor() {
    super()
  }

  on<E extends any | null | undefined = any>(
    type: MessageChannelEvents[number],
    callback: (event?: E) => void
  ): this {
    return super.on(type, callback)
  }

  emit<E extends any | null | undefined = any>(
    type: MessageChannelEvents[number],
    event?: E
  ): this {
    return super.emit(type, event)
  }

  broadcastCallbacks = new Map<
    string | null | undefined,
    Map<string, Set<Function>>
  >()

  rawCall<T = any>(
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: Models.PayloadType,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fromPlugin: boolean,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    payload?: any
  ): Promise<T> {
    throw new Error("Not implemented rawCall")
  }

  getCertificateProvider(): CertificateProvider {
    throw new Error("Not implemented getCertificateProvider")
  }

  getDevice(): BaseDevice {
    throw new Error("Not implemented getDevice")
  }

  refreshPlugins(): Promise<void> {
    return Promise.reject("Not implemented refreshPlugins")
  }

  getState(): RootState {
    throw new Error("Not implemented getState")
  }
  getStore(): StatoStore {
    throw new Error("Not implemented getStore")
  }

  toPayload(envelope: Envelope, body: any = null, from: Partial<Envelope> = null): Payload<Uint8Array, Uint8Array> {
    
    return Option.of(envelope)
      .map(it => from ? new Models.Envelope({
        ...it,
        ...from
      }) : it)
      .map(it => body ? this.toMessage(it, body) : it)
      .map(it => Object.assign(it, {
        state: this.getSDKState()
      }))
      .map(it => ({
        data: Models
          .Envelope
          .encode(it)
          .finish(),
  
        metadata: Models
          .SDKState
          .encode(this.getSDKState())
          .finish()
      }))
      .getOrThrow()
    
  }
  
  
  
  toMessage(envelope: Envelope, body: any = null): Models.Envelope {
    const newEnvelope = new Models.Envelope(envelope)
    newEnvelope.payload.body = dataToArray(body)
    return newEnvelope
  }
  
}
