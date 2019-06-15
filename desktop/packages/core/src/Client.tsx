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
import { StatoPluginComponent } from "./plugin"
import BaseDevice from "./devices/BaseDevice"
import * as UUID from "uuid"
import { getLogger, Logger } from "./fb-interfaces/Logger"
import { RootState, Store } from "./reducers/index"
//import { setPluginState } from "./reducers/PluginStatesReducer"
import { PartialResponder, Payload, ReactiveSocket } from "rsocket-types" // $FlowFixMe perf_hooks is a new API in node
import { performance } from "perf_hooks"
import { reportPluginFailures } from "./utils/metrics"
//import { default as isProduction } from "./utils/isProduction"
import { registerPlugins } from "./reducers/PluginReducer"
import { getValue, guard, isDefined, isPromise } from "typeguard"
import { KnownNativePlugin, NativePluginFactories } from "./NativePluginTypes"
import { Plugin, Plugins } from "./PluginTypes"
import { Either, Future, Option } from "prelude-ts"
import { Messenger } from "./messaging/Messenger"

import { envelopFromPayload, handleMessage } from "./messaging/Messages"
import { isEmpty } from "lodash"
import { Single } from "rsocket-flowable"
import { toTrueOption } from "@stato/common"
import * as _ from "lodash"

import { stato as Models } from "@stato/models"
import { createEnvelopeWithPayloadData, dataToArray, Envelope, ProtoMessage, toPayload } from "./messaging/Helpers"

const log = getLogger(__filename)

export type ClientExport = {
  id:string
  query:Models.ISDKState
}

type RequestMetadata = {
  pluginId?:string
  type:Models.PayloadType
  typeName?:string | undefined
  requestId:string
}


export default class Client extends Messenger {

  connected:boolean = true
  
  private activePlugins = new Set<string>()

  private requestCallbacks = new Map<string,
    {
      resolve:(data:any) => void
      reject:(err:Error) => void
      metadata:RequestMetadata
    }>()
  
  responder:PartialResponder<Uint8Array, Uint8Array> = {
    fireAndForget: (payload:Payload<Uint8Array, Uint8Array>) => {
      log.info("Received FireAndForget", payload)
      this.onMessage(payload.data!!)
    }
  }
  
  // @ts-ignore
  constructor(
    public id:string,
    public query:Models.SDKState,
    private connection:ReactiveSocket<Uint8Array, Uint8Array> | null,
    private logger:Logger,
    private store:Store,
    public plugins:Plugins = []
  ) {
    super()
    
    //this.sdkVersion = query.sdkVersion || 0
    
    if (connection) {
      connection.connectionStatus().subscribe({
        onNext(payload) {
          if (payload.kind == "ERROR" || payload.kind == "CLOSED") {
            this.connected = false
          }
        },
        
        onSubscribe(subscription) {
          subscription.request(Number.MAX_SAFE_INTEGER)
        }
      })
    }
  }
  
  getStore():StatoStore {
    return this.store
  }
  
  getState():RootState {
    return this.store.getState()
  }
  
  getDevice():BaseDevice | null {
    return (
      this.store
        .getState()
        .connections.devices.find(
        (device:BaseDevice) => device.serial === this.query.nodeId
      ) || null
    )
  }
  
  getDeviceSerial():string {
    return getValue(() => this.getDevice()!!.serial)
  }
  
  // noinspection JSUnusedGlobalSymbols
  supportsPlugin(plugin:StatoPluginComponent<any, any, any>):boolean {
    return this.plugins.includes(plugin.id)
  }
  
  async init() {
    await this.refreshPlugins()
  } // get the supported plugins
  
  async getPlugins():Promise<Plugins> {
    const plugins = await this.rawCall<Array<string>>(
      Models.PayloadType.PayloadTypePluginList,
      false
    )
    
    log.info("Device supports plugins", plugins)
    this.plugins = plugins
    const nativePlugins = plugins
      .map(plugin => /_nativeplugin_([^_]+)_([^_]+)/.exec(plugin) || null)
      .filter(parts => parts !== null && Array.isArray(parts))
      .map((parts:RegExpExecArray | null) => {
        const [id, type, title] = parts!!,
          factory = NativePluginFactories[type as KnownNativePlugin]

        return factory ? factory({ id, title }) : null
      })
      .filter(plugin => isDefined(plugin))
    
    this.store.dispatch(registerPlugins(nativePlugins as Plugin[]))
    return plugins
  } // get the plugins, and update the UI
  
  async refreshPlugins() {
    await this.getPlugins()
    //this.emit("plugins-change")
  }
  
  // private messageHandlers: {
  //   [Method in MessageMethod]: (msg: MessagePayload<Method>, envelope: ReadyEnvelope<MessagePayload<Method>>) => void
  // } = {
  //   refreshPlugins: () => this.refreshPlugins(),
  //   execute: msg => {
  //
  //   }
  // }
  
  private onMessage(msg:Uint8Array):any {
    if (!msg) throw new Error("Msg is not valid")
    //log.info("onMessage: ", msg)
    Option.of(Models.Envelope.decode(msg))
      .map((envelope:Models.Envelope) => {
        const either = isEmpty(envelope.requestId)
          ? Either.left<Envelope, Envelope>(envelope)
          : Either.right<Envelope, Envelope>(envelope)
        
        either.match<unknown>({
          Left: envelope =>
            Option.of(handleMessage(this, envelope))
              .map(result =>
                Future.do(() =>
                  isPromise(result) ? result : Promise.resolve(result)
                ).toPromise()
              )
              .ifSome(async pendingResult =>
                Option.of(await pendingResult).map(result =>
                  !result
                    ? Single.of({} as any)
                    : result instanceof Single
                    ? result
                    : Single.of(toPayload(envelope, result))
                )
              )
              .ifNone(() => {
                log.debug("No result")
              }),
          Right: envelope => {
            //const Type = getMessageHandler(encoded.method)[0],
            // envelope = new ReadyEnvelope(
            //   new Type(JSON.parse(encoded.payload)),
            //   encoded
            // ),
            
            log.info("onMessage: ", envelope)
            const result = handleMessage(this, envelope),
              { requestId } = envelope
            
            Option.of(this.requestCallbacks.get(requestId)).ifSome(
              callbacks => {
                this.requestCallbacks.delete(requestId)
                this.finishTimingRequestResponse(callbacks.metadata)
                this.onResponse(result, callbacks.resolve, callbacks.reject)
              }
            )
            
            return Single.of({} as any)
          }
        })
      })
    
    /*
    
    if (!isString(msg)) {
      return
    }

    const data = Run(() => {
      try {
        return JSON.parse(msg) as
      } catch (err) {
        log.error(`Invalid JSON: ${msg}`, "clientMessage", err)
        return null
      }
    })

    log.debug(data, "message:receive")
    if (!data) return

    const { id, error, method } = data

    if (!id) {
      if (!!error) {
        log.error(
          `Error received from device ${
            method ? `when calling ${method}` : ""
          }: ${error.message} + \nDevice Stack Trace: ${error.stacktrace}`,
          "deviceError",
          error
        )
        handleError(
          this.store,
          getValue(() => this.getDevice()!!.serial),
          error
        )
      } else {
        guard(() => this.messageHandlers[method](data))
      }
    } else if (this.sdkVersion < 1) {
      const callbacks = this.requestCallbacks.get(id)
      if (!callbacks) {
        return
      }

      this.requestCallbacks.delete(id)
      this.finishTimingRequestResponse(callbacks.metadata)
      this.onResponse(data, callbacks.resolve, callbacks.reject)
    }*/
  }
  
  onResponse<T = any, E extends Error = any>(
    result:T | E,
    resolve:(a:T) => void,
    reject:(a:E) => void
  ) {
    if (result instanceof Error) reject(result)
    else resolve(result)
    // .toSuccessOption().match({
    // Some: () => resolve(envelope.payload as T),
    // None: () => {
    //   const error = envelope.payload as E
    //
    //   if (error) {
    //     handleError(this.store, this.getDeviceSerial(), error)
    //   }
    // }
    // })
  }
  
  toJSON():ClientExport {
    return {
      id: this.id,
      query: this.query
    }
  }
  
  subscribe<P = any>(
    api:string | null | undefined = null,
    method:string,
    callback:(params:P) => void
  ) {
    log.info("Subscribe", api, method, callback)
    let apiCallbacks = this.broadcastCallbacks.get(api)
    
    if (!apiCallbacks) {
      apiCallbacks = new Map()
      this.broadcastCallbacks.set(api, apiCallbacks)
    }
    
    let methodCallbacks = apiCallbacks.get(method)
    
    if (!methodCallbacks) {
      methodCallbacks = new Set()
      apiCallbacks.set(method, methodCallbacks)
    }
    
    methodCallbacks.add(callback)
  }
  
  unsubscribe(
    api:string | null | undefined = null,
    method:string,
    callback:Function
  ) {
    const apiCallbacks = this.broadcastCallbacks.get(api)
    
    if (!apiCallbacks) {
      return
    }
    
    const methodCallbacks = apiCallbacks.get(method)
    
    if (!methodCallbacks) {
      return
    }
    
    methodCallbacks.delete(callback)
  }
  
  rawCall<T = any>(
    type:Models.PayloadType,
    fromPlugin:boolean,
    data?:any
  ):Promise<T> {
    log.info("rawCall", type, fromPlugin, data)
    return new Promise((resolve, reject) => {
      const
        requestId = UUID.v4(),
        typeName = Models.PayloadType[type],
        pluginId = fromPlugin ? this.id : "",
        pluginMetadata = { pluginId, type, typeName, requestId },
        mark = this.getPerformanceMark(pluginMetadata)
      
      performance.mark(mark)
      
      const canReceive = () =>
        !fromPlugin || this.isAcceptingMessagesFromPlugin(pluginId)
      
      toTrueOption(canReceive()).ifSome(() => {
        const
          payload = Object.assign(new Models.EnvelopePayload(),{
            type,
            body: dataToArray(data)// (Object.getPrototypeOf(data).encode(data))
          }),
          envelope = new Models.Envelope({
            requestId,
            payload
          })
        
        
        payload.type = type
        //payload.body = Google.protobuf.Any.create(data)
        const { connection } = this,
          requestPayload = this.toPayload(
            envelope
            //data
          )
        
        log.info("Sending Request", envelope, requestPayload)
        
        return !connection
          ? undefined
          : connection.requestResponse(requestPayload).subscribe({
            onComplete: rawPayload => {
              toTrueOption(canReceive).match({
                Some: async () => {
                  const
                    [handler, resEnvelope, resEnvelopePayload, resMessage] = envelopFromPayload(rawPayload),
                    logEventName = this.getLogEventName(pluginMetadata)
                  
                  if (resEnvelope.isError) {
                    reject(resMessage)
                    return
                  }
                  
                  log.info("Handling result", resEnvelope.toJSON())
                  const result = await handler(
                    this,
                    resMessage,
                    resEnvelopePayload,
                    resEnvelope)
                  
                  
                  this.logger.trackTimeSince(mark, logEventName)
                  log.info("Processed result", result)
                  //if (result)
                  this.onResponse(result, resolve, reject)
                },
                None: async () => resolve()// Promise.resolve()
              })
            },
            
            // Open fresco then layout and you get errors because responses come back after deinit.
            onError: e => {
              log.error("Response error", e)
              reject(e)
              // if (this.isAcceptingMessagesFromPlugin(pluginId)) {
              //   reject(e)
              // }
            }
          })
      })
    })
  }
  
  startTimingRequestResponse(data:RequestMetadata) {
    performance.mark(this.getPerformanceMark(data))
  }
  
  finishTimingRequestResponse(data:RequestMetadata) {
    const mark = this.getPerformanceMark(data)
    const logEventName = this.getLogEventName(data)
    this.logger.trackTimeSince(mark, logEventName)
  }
  
  isAcceptingMessagesFromPlugin(plugin:string | null | undefined) {
    return this.connection && (!plugin || this.activePlugins.has(plugin))
  }
  
  getPerformanceMark(data:RequestMetadata):string {
    const { typeName, requestId } = data
    return `request_response_${typeName}_${requestId}`
  }
  
  getLogEventName(data:RequestMetadata):string {
    const { method, payload } = data as any
    return payload && payload.api && payload.type
      ? `request_response_${method}_${payload.api}_${payload.type}`
      : `request_response_${method}`
  }
  
  initPlugin(pluginId:string) {
    log.info("Init plugin", pluginId)
    this.activePlugins.add(pluginId)
    this.rawSend(
      Models.PayloadType.PayloadTypePluginSetActive,
      Models.PluginSetActiveRequestResponse.create({
        pluginId
      })
    )
  }
  
  deinitPlugin(pluginId:string) {
    log.info("Deinit plugin", pluginId)
    this.activePlugins.delete(pluginId)
    this.rawSend(
      Models.PayloadType.PayloadTypePluginSetActive,
      Models.PluginSetActiveRequestResponse.create({
        pluginId: ""
      })
    )
  }
  
  rawSend<P extends (ProtoMessage | string | undefined) = any>(
    type:Models.PayloadType,
    data?:P
  ) {
    guard(() => {
      Option.of(this.connection)
        .ifSome(conn => {
          conn.fireAndForget(
            this.toPayload(
              createEnvelopeWithPayloadData(type, data)
            )
          )
        })
    }, err => log.error("Unable to send fireAndForget", err))
  }
  
  call<T = any, Body = any>(
    pluginId:string,
    method:string,
    fromPlugin:boolean,
    body?:Body
  ):Promise<T> {
    return reportPluginFailures(
      this.rawCall(Models.PayloadType.PayloadTypePluginCall, fromPlugin, Models.PluginCallRequestResponse.create({
        pluginId,
        method,
        body: dataToArray(body)
      }).toJSON()),
      `Call-${method}`,
      pluginId
    )
  }
 
  supportsMethod(api:string, method:string):Promise<boolean> {
    if (this.sdkVersion < 2) {
      return Promise.resolve(false)
    }
    
    return this.rawCall(Models.PayloadType.PayloadTypePluginSupported, true, {
      api,
      method
    }).then(response => response.isSupported)
  }
}
