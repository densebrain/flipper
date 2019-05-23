/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {FlipperPluginComponent} from './plugin'
import BaseDevice, {OS} from './devices/BaseDevice'

import {getLogger, Logger} from './fb-interfaces/Logger'
import {Store} from './reducers/index'
import {setPluginState} from './reducers/PluginStatesReducer'
import {PartialResponder, Payload, ReactiveSocket} from 'rsocket-types' // $FlowFixMe perf_hooks is a new API in node
import {performance} from 'perf_hooks'
import {reportPluginFailures} from './utils/metrics'
import {default as isProduction} from './utils/isProduction'
import {registerPlugins} from './reducers/PluginReducer'
import {getValue, guard, isDefined, isString} from "typeguard"
import {KnownNativePlugin, NativePluginFactories} from "./NativePluginTypes"
import {isDevicePlugin, Plugin, PluginClientMessage, Plugins} from "./PluginTypes"
import {Run} from "./utils/runtime"

const EventEmitter = (require('events') as any)

const invariant = require('invariant')

const log = getLogger(__filename)


export type ClientQuery = {
  app:string;
  os:OS;
  device:string;
  device_id:string;
  sdk_version?:number;
};
export type ClientExport = {
  id:string;
  query:ClientQuery;
};
type ErrorType = {
  message:string;
  stacktrace:string;
  name:string;
};
type RequestMetadata<P = any> = {
  method:string;
  id:number;
  payload:P | null | undefined;
};

type RequestResponse<T = any, E extends ErrorType = any> = {
  success?:T;
  error?:E;
};




const handleError = (store:Store, deviceSerial:string | null | undefined, error:ErrorType) => {
  if (isProduction()) {
    return
  }
  
  const crashReporterPlugin = store.getState().plugins.devicePlugins.get('CrashReporter')
  
  if (!crashReporterPlugin) {
    return
  }
  
  const
    pluginKey = `${deviceSerial || ''}#CrashReporter`,
    persistedState = {
      ...getValue(() => crashReporterPlugin.componentClazz.defaultPersistedState,{}),
      ...store.getState().pluginStates[pluginKey]
    },
    isCrashReport:boolean = Boolean(error.name || error.message),
    payload = isCrashReport ? {
      name: error.name,
      reason: error.message,
      stacktrace: error.stacktrace
    } : {
      name: 'Plugin Error',
      reason: JSON.stringify(error)
    }
  
  const reducer = crashReporterPlugin.componentClazz.persistedStateReducer
  if (reducer) {
    const newPluginState = reducer!!(persistedState, {type: 'flipper-crash-report', payload} as any)
  
    if (persistedState !== newPluginState) {
      store.dispatch(setPluginState({
        pluginKey,
        state: newPluginState
      }))
    }
  }
  
}

export type DeviceMessageMethod =  "refreshPlugins" | "execute" | string

export type DeviceMessageData<Method extends DeviceMessageMethod> =
  Method extends "refreshPlugins" ?
    null :
    Method extends "execute" ?
      PluginClientMessage<any, any>  :
      Method extends string ? any : never

export interface DeviceMessage<Method extends DeviceMessageMethod = any, Payload extends DeviceMessageData<Method> = DeviceMessageData<Method>, Success = any, Err extends ErrorType = any> {
  id?:number;
  method?:Method;
  payload?:Payload;
  success?:Success;
  error?:Err;
}


export default class Client extends EventEmitter {
  
  //app:App
  connected:boolean = true
  
  private readonly sdkVersion:number
  private messageIdCounter:number = 0
  
  private activePlugins = new Set<string>()
  private broadcastCallbacks = new Map<string | null | undefined, Map<string, Set<Function>>>()
  private requestCallbacks = new Map<number, {
    resolve:(data:any) => void;
    reject:(err:Error) => void;
    metadata:RequestMetadata;
  }>()
  
  responder:PartialResponder<string, string> = {
    fireAndForget: (payload:Payload<string, string>) => {
      this.onMessage(payload.data!!)
    }
  }
  
  constructor(
    public id:string,
    public query:ClientQuery,
    private connection:ReactiveSocket<string, string> | null,
    private logger:Logger,
    private store:Store,
    public plugins:Plugins = []) {
    super()
    
    
    this.sdkVersion = query.sdk_version || 0
    
    
    
    if (connection) {
      connection.connectionStatus().subscribe({
        
        onNext(payload) {
          if (payload.kind == 'ERROR' || payload.kind == 'CLOSED') {
            this.connected = false
          }
        },
        
        onSubscribe(subscription) {
          subscription.request(Number.MAX_SAFE_INTEGER)
        }
        
      })
    }
  }
  
  getDevice():BaseDevice | null {
    return this.store.getState().connections.devices.find((device:BaseDevice) => device.serial === this.query.device_id) || null
  }
  
  getDeviceSerial():string {
    return getValue(() => this.getDevice()!!.serial)
  }
  
  on(event:'plugins-change' | 'close', callback:() => void) {
    super.on(event, callback)
  };
  
  
  
  supportsPlugin(plugin:FlipperPluginComponent<any, any, any>):boolean {
    return this.plugins.includes(plugin.id)
  }
  
  async init() {
    await this.getPlugins()
  } // get the supported plugins
  
  
  async getPlugins():Promise<Plugins> {
    const plugins = await this.rawCall<{ plugins:Plugins }>('getPlugins', false).then(data => data.plugins)
    this.plugins = plugins
    const nativePlugins = plugins
      .map(plugin => /_nativeplugin_([^_]+)_([^_]+)/.exec(plugin) || null)
      .filter(parts => parts !== null && Array.isArray(parts))
      .map((parts:RegExpExecArray | null) => {
        const [id, type, title] = parts!!,
          factory = NativePluginFactories[type as KnownNativePlugin]
        
        return factory ? factory({id, title}) : null
      })
      .filter(plugin => isDefined(plugin))
    this.store.dispatch(registerPlugins(nativePlugins as Plugin[]))
    return plugins
  } // get the plugins, and update the UI
  
  
  async refreshPlugins() {
    await this.getPlugins()
    this.emit('plugins-change')
  }
  
  
  private messageHandlers:{[id in DeviceMessageMethod]: (msg:DeviceMessage<id>) => void} = {
    refreshPlugins: () => this.refreshPlugins(),
    execute: (msg) => {
      invariant(msg, 'expected params')
      
      const
        {payload} = msg,
        {api, type} = payload,
        state = this.store.getState(),
        persistingPlugin:Plugin | null | undefined = state.plugins.clientPlugins.get(api) || state.plugins.devicePlugins.get(payload.api),
        persistingComponentClazz = getValue(() => persistingPlugin!!.componentClazz)
  
      if (persistingComponentClazz.persistedStateReducer) {
        let pluginKey = `${this.id}#${api}` //$FlowFixMe
  
        // For device plugins, we are just using the device id instead of client id as the prefix.
        if (isDevicePlugin(persistingPlugin)) {
          pluginKey = `${getValue(() => this.getDevice()!!.serial) || ''}#${api}`
        }
    
        const
          persistedState = {
            ...(persistingComponentClazz.defaultPersistedState || {}),
            ...this.store.getState().pluginStates[pluginKey]
          },
          newPluginState = persistingComponentClazz.persistedStateReducer(persistedState, payload)
    
        log.debug(`Executing ${pluginKey}`, payload, persistedState, newPluginState)
        
        if (persistedState !== newPluginState) {
          this.store.dispatch(setPluginState({
            pluginKey,
            state: newPluginState
          }))
        }
      } else {
        const
          apiCallbacks = this.broadcastCallbacks.get(api),
          methodCallbacks:Set<Function> | null | undefined = getValue(() => apiCallbacks.get(type),new Set())
  
        methodCallbacks.forEach(fn => fn(payload))
      }
    }
  }
  
  private onMessage(msg:any):any {
    if (!isString(msg)) {
      return
    }
    
    const data = Run(() => {
      try {
        return JSON.parse(msg) as DeviceMessage
      } catch (err) {
        log.error(`Invalid JSON: ${msg}`, 'clientMessage', err)
        return null
      }
    })
    
    log.debug(data, 'message:receive')
    if (!data)
      return
    
    const
      {
        id,
        error,
        method
      } = data
      
      
    
    if (!id) {
      if (!!error) {
        log.error(`Error received from device ${method ? `when calling ${method}` : ''}: ${error.message} + \nDevice Stack Trace: ${error.stacktrace}`, 'deviceError', error)
        handleError(this.store, getValue(() => (this.getDevice()!!.serial)), error)
      } else  {
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
    }
  }
  
  onResponse<T = any, E extends Error = any>(data:RequestResponse, resolve:(a:T) => void, reject:(a:E) => void) {
    if (data.success) {
      resolve(data.success)
    } else if (data.error) {
      reject(data.error)
      const {
        error
      } = data
      
      if (error) {
        handleError(this.store, this.getDeviceSerial(), error)
      }
    }
  }
  
  toJSON():ClientExport {
    return {
      id: this.id,
      query: this.query
    }
  }
  
  subscribe<P = any>(api:string | null | undefined = null, method:string, callback:(params:P) => void) {
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
  
  unsubscribe(api:string | null | undefined = null, method:string, callback:Function) {
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
  
  rawCall<T = any>(method:string, fromPlugin:boolean, payload?:any):Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.messageIdCounter++
      const metadata:RequestMetadata = {
        method,
        id,
        payload
      }
      
      if (this.sdkVersion < 1) {
        this.requestCallbacks.set(id, {
          reject,
          resolve,
          metadata
        })
      }
      
      const data = {
        id,
        method,
        payload
      }
      const plugin = payload && payload.api
      console.debug(data, 'message:call')
      
      if (this.sdkVersion < 1) {
        this.startTimingRequestResponse({
          method,
          id,
          payload
        })
        
        if (this.connection) {
          this.connection.fireAndForget({
            data: JSON.stringify(data)
          })
        }
        
        return
      }
      
      const mark = this.getPerformanceMark(metadata)
      performance.mark(mark)
      
      if (!fromPlugin || this.isAcceptingMessagesFromPlugin(plugin)) {
        this.connection && this.connection.requestResponse({
          data: JSON.stringify(data)
        }).subscribe({
          onComplete: payload => {
            if (!fromPlugin || this.isAcceptingMessagesFromPlugin(plugin)) {
              const logEventName = this.getLogEventName(data)
              this.logger.trackTimeSince(mark, logEventName)
              const response:RequestResponse = JSON.parse(payload.data!!)
              this.onResponse(response, resolve, reject)
            }
          },
          // Open fresco then layout and you get errors because responses come back after deinit.
          onError: e => {
            if (this.isAcceptingMessagesFromPlugin(plugin)) {
              reject(e)
            }
          }
        })
      }
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
    const {
      method,
      id
    } = data
    return `request_response_${method}_${id}`
  }
  
  getLogEventName(data:RequestMetadata):string {
    const {
      method,
      payload
    } = data as any
    return payload && payload.api && payload.type ? `request_response_${method}_${payload.api}_${payload.type}` : `request_response_${method}`
  }
  
  initPlugin(pluginId:string) {
    this.activePlugins.add(pluginId)
    this.rawSend('init', {
      plugin: pluginId
    })
  }
  
  deinitPlugin(pluginId:string) {
    this.activePlugins.delete(pluginId)
    this.rawSend('deinit', {
      plugin: pluginId
    })
  }
  
  rawSend<P = any>(method:string, payload?:P):void {
    const data = {
      method,
      payload
    }
    console.debug(data, 'message:send')
    
    if (this.connection) {
      this.connection.fireAndForget({
        data: JSON.stringify(data)
      })
    }
  }
  
  call<T = any, P = any>(api:string, type:string, fromPlugin:boolean, payload?:P):Promise<T> {
    return reportPluginFailures(this.rawCall('execute', fromPlugin, {
      api,
      type,
      payload
    }), `Call-${type}`, api)
  }
  
  send<P = any>(api:string, type:string, payload?:P):void {
    if (!isProduction()) {
      console.warn(`${api}:${type || ''} client.send() is deprecated. Please use call() instead so you can handle errors.`)
    }
    
    this.rawSend('execute', {
      api,
      type,
      payload
    })
  }
  
  supportsMethod(api:string, method:string):Promise<boolean> {
    if (this.sdkVersion < 2) {
      return Promise.resolve(false)
    }
    
    return this.rawCall('isMethodSupported', true, {
      api,
      method
    }).then(response => response.isSupported)
  }
  
}
