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
import {setPluginState} from './reducers/pluginStates'
import {PartialResponder, Payload, ReactiveSocket} from 'rsocket-types' // $FlowFixMe perf_hooks is a new API in node
import {performance} from 'perf_hooks'
import {reportPluginFailures} from './utils/metrics'
import {default as isProduction} from './utils/isProduction'
import {registerPlugins} from './reducers/plugins'
import {getValue, isDefined} from "typeguard"
import {KnownNativePlugin, NativePluginFactories} from "./NativePluginTypes"
import {isDevicePlugin, Plugin} from "./PluginTypes"

const EventEmitter = (require('events') as any)

const invariant = require('invariant')

const log = getLogger(__filename)

type Plugins = Array<string>;
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
  params:P | null | undefined;
};

type RequestResponse<T = any, E extends ErrorType = any> = {
  success?:T;
  error?:E;
};

export type PluginID = string


const handleError = (store:Store, deviceSerial:string | null | undefined, error:ErrorType) => {
  if (isProduction()) {
    return
  }
  
  const crashReporterPlugin = store.getState().plugins.devicePlugins.get('CrashReporter')
  
  if (!crashReporterPlugin) {
    return
  }
  
  const pluginKey = `${deviceSerial || ''}#CrashReporter`
  const persistedState = {
    ...getValue(() => crashReporterPlugin.componentClazz.defaultPersistedState,{}),
    ...store.getState().pluginStates[pluginKey]
  }
  const isCrashReport:boolean = Boolean(error.name || error.message)
  const payload = isCrashReport ? {
    name: error.name,
    reason: error.message,
    callstack: error.stacktrace
  } : {
    name: 'Plugin Error',
    reason: JSON.stringify(error)
  }
  
  const reducer = crashReporterPlugin.componentClazz.persistedStateReducer
  if (reducer) {
    const newPluginState = reducer!!(persistedState, 'flipper-crash-report', payload)
  
    if (persistedState !== newPluginState) {
      store.dispatch(setPluginState({
        pluginKey,
        state: newPluginState
      }))
    }
  }
  
}

interface MessageData<Method extends string = string, Params extends object = any, Success extends any = any, E extends ErrorType = any> {
  id?:number;
  method?:Method;
  params?:Params;
  success?:Success;
  error?:E;
}


export default class Client extends EventEmitter {
  constructor(id:string, query:ClientQuery, conn:ReactiveSocket<string, string> | null, logger:Logger, store:Store, plugins?:Plugins | null | undefined) {
    super()
    this.connected = true
    this.plugins = plugins ? plugins : []
    this.connection = conn
    this.id = id
    this.query = query
    this.sdkVersion = query.sdk_version || 0
    this.messageIdCounter = 0
    this.logger = logger
    this.store = store
    this.broadcastCallbacks = new Map()
    this.requestCallbacks = new Map()
    this.activePlugins = new Set()
    const client = this
    this.responder = {
      fireAndForget: (payload:Payload<string, string>) => {
        client.onMessage(payload.data!!)
      }
    }
    
    if (conn) {
      conn.connectionStatus().subscribe({
        onNext(payload) {
          if (payload.kind == 'ERROR' || payload.kind == 'CLOSED') {
            client.connected = false
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
  
  //app:App
  connected:boolean
  id:string
  query:ClientQuery
  sdkVersion:number
  messageIdCounter:number
  plugins:Plugins
  connection:ReactiveSocket<string, string> | null | undefined
  responder:PartialResponder<string, string>
  store:Store
  activePlugins:Set<string>
  broadcastCallbacks:Map<string | null | undefined, Map<string, Set<Function>>>
  requestCallbacks:Map<number, {
    resolve:(data:any) => void;
    reject:(err:Error) => void;
    metadata:RequestMetadata;
  }>
  
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
  
  
  onMessage(msg:string):any {
    // noinspection SuspiciousTypeOfGuard
    if (typeof msg !== 'string') {
      return
    }
    
    let data:MessageData | null = null
    try {
      data = JSON.parse(msg) as MessageData
    } catch (err) {
      log.error(`Invalid JSON: ${msg}`, 'clientMessage', err)
      return null
    }
    
    log.debug(data, 'message:receive')
    if (!data) return
    
    const {
      id,
      method
    } = data
    
    if (!id) {
      const {
        error
      } = data
      
      if (!!error) {
        log.error(`Error received from device ${method ? `when calling ${method}` : ''}: ${error.message} + \nDevice Stack Trace: ${error.stacktrace}`, 'deviceError', error)
        handleError(this.store, getValue(() => (this.getDevice()!!.serial)), error)
      } else if (method === 'refreshPlugins') {
        this.refreshPlugins()
      } else if (method === 'execute') {
        const params = data.params as any
        invariant(params, 'expected params')
        const
          state = this.store.getState(),
          persistingPlugin:Plugin | null | undefined = state.plugins.clientPlugins.get(params.api) || state.plugins.devicePlugins.get(params.api),
          persistingComponentClazz = getValue(() => persistingPlugin!!.componentClazz),
          persistingComponent = getValue(() => persistingPlugin!!.component)
        
        if (persistingComponent && persistingComponentClazz.persistedStateReducer) {
          let pluginKey = `${this.id}#${params.api}` //$FlowFixMe
          
          if (isDevicePlugin(persistingPlugin)) {
            // For device plugins, we are just using the device id instead of client id as the prefix.
            pluginKey = `${getValue(() => this.getDevice()!!.serial) || ''}#${params.api}`
          }
          
          const persistedState = {
            ...(persistingComponentClazz.defaultPersistedState || {}),
            ...this.store.getState().pluginStates[pluginKey]
          }
          
          const newPluginState = persistingComponentClazz.persistedStateReducer(persistedState, params.method, params.params)
          
          if (persistedState !== newPluginState) {
            this.store.dispatch(setPluginState({
              pluginKey,
              state: newPluginState
            }))
          }
        } else {
          const apiCallbacks = this.broadcastCallbacks.get(params.api)
          
          if (!apiCallbacks) {
            return
          }
          
          const methodCallbacks:Set<Function> | null | undefined = apiCallbacks.get(params.method)
          
          if (methodCallbacks) {
            for (const callback of methodCallbacks) {
              callback(params.params)
            }
          }
        }
      }
      
      return
    }
    
    
    if (this.sdkVersion < 1) {
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
  
  rawCall<T = any>(method:string, fromPlugin:boolean, params?:any):Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.messageIdCounter++
      const metadata:RequestMetadata = {
        method,
        id,
        params
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
        params
      }
      const plugin = params && params.api
      console.debug(data, 'message:call')
      
      if (this.sdkVersion < 1) {
        this.startTimingRequestResponse({
          method,
          id,
          params
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
      params
    } = data as any
    return params && params.api && params.method ? `request_response_${method}_${params.api}_${params.method}` : `request_response_${method}`
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
  
  rawSend<P = any>(method:string, params?:P):void {
    const data = {
      method,
      params
    }
    console.debug(data, 'message:send')
    
    if (this.connection) {
      this.connection.fireAndForget({
        data: JSON.stringify(data)
      })
    }
  }
  
  call<T = any, P = any>(api:string, method:string, fromPlugin:boolean, params?:P):Promise<T> {
    return reportPluginFailures(this.rawCall('execute', fromPlugin, {
      api,
      method,
      params
    }), `Call-${method}`, api)
  }
  
  send<P = any>(api:string, method:string, params?:P):void {
    if (!isProduction()) {
      console.warn(`${api}:${method || ''} client.send() is deprecated. Please use call() instead so you can handle errors.`)
    }
    
    this.rawSend('execute', {
      api,
      method,
      params
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
