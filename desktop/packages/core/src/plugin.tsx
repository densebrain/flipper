/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {App} from "./App"
import Client from "./Client"

import * as React from "react"
import BaseDevice from "./devices/BaseDevice"
import AndroidDevice from "./devices/AndroidDevice"
import IOSDevice from "./devices/IOSDevice"
import {Theme} from "./ui/themes"
import {Notification, PluginActions, PluginReducers} from "./PluginTypes"
import {
  DevicePluginComponent,
  PluginClient,
  PluginComponent,
  PluginComponentProps
} from "./PluginTypes"
import {KeyboardActionHandler} from "./KeyboardTypes"


// const invariant = require("invariant") // This function is intended to be called from outside of the plugin.
// If you want to `call` from the plugin use, this.client.call


export type FlipperPluginProps<PersistedState, ExtraProps = {}> = PluginComponentProps<PersistedState> & ExtraProps

export class FlipperBasePluginComponent<Props extends FlipperPluginProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any>
  extends React.Component<Props,
    State> implements PluginComponent<Props, State, Actions, PersistedState> {
  
  constructor(props:Props) {
    super(props)
    
  }
  
  get theme():Theme {
    return this.props.theme
  }
  
  get id() {
    return this.props.id
  }
  
  get title() {
    return this.props.title
  }
  
  get entry() {
    return this.props.entry
  }
  
  get icon() {
    return this.props.icon
  }
  
  get gatekeeper() {
    return this.props.gatekeeper
  }
  
  get bugs() {
    return this.props.bugs
  }
  
  screenshot:string | null = null
  //defaultPersistedState: PersistedState | null = null
  // persistedStateReducer(
  //   persistedState: PersistedState,
  //   _method: string,
  //   _data: Object
  // ): Partial<PersistedState> {
  //   return persistedState || {}
  // }
  
  
  // getActiveNotifications(_persistedState:PersistedState):Array<Notification> {
  //   return []
  // }
  
  onRegisterDevice(
    _store:FlipperStore,
    _baseDevice:BaseDevice,
    _setPersistedState:(pluginKey:string, newPluginState:PersistedState | null | undefined) => void
  ):void {
  
  }
  
  readonly reducers = {} as PluginReducers<State, Actions, Actions["type"]>
  
  app:App | null = null
  onKeyboardAction:KeyboardActionHandler | null = null
  
  toJSON() {
    return `<${this.constructor.name}#${(this.constructor as any).id}>`
  } // methods to be overridden by plugins
  
  init():void {
  }
  
  teardown():void {
  }
  
  computeNotifications(_props:Props, _state:State):Array<Notification> {
    return []
  } // methods to be overridden by subclasses
  
  dispatchAction<Type extends Actions["type"], Payload extends Actions[Type] = Actions[Type]>(type:Type, payload:Payload) {
    // $FlowFixMe
    const action = this.reducers[type]
    
    if (!action) {
      // $FlowFixMe
      throw new ReferenceError(`Unknown action ${type}`)
    }
    
    if (typeof action === "function") {
      this.setState(action(this.state, payload) as any)
    } else {
      throw new TypeError(`Reducer ${type} isn't a function`)
    }
  }
  
  
  getDevice(): BaseDevice | null {
    throw new Error("getDevice() not implemented in base plugin")
  }
  
  getAndroidDevice():AndroidDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof AndroidDevice))
      throw new Error("expected android device")
    
    return device as any
  }
  
  getIOSDevice():IOSDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof IOSDevice))
      throw new Error("expected ios device")
    
    return device as any
  }
  
}

export class FlipperPluginComponent<
  Props extends FlipperPluginProps<PersistedState> = any,
  State = any,
  Actions extends PluginActions = any,
  PersistedState = any
> extends FlipperBasePluginComponent<
  Props,
  State,
  Actions,
  PersistedState
> implements PluginComponent<
  Props,
  State,
  Actions,
  PersistedState
> {
  
  subscriptions:Array<{
    method:string,
    callback:Function
  }>
  client:PluginClient
  realClient:Client
  
  constructor(props:Props) {
    super(props)
    const id = this.props.id
    this.subscriptions = [] // $FlowFixMe props.target will be instance of Client
    
    this.realClient = props.target as Client
    this.client = {
      call: (method, params) => this.realClient.call(id, method, true, params),
      send: (method, params) => this.realClient.send(id, method, params),
      subscribe: (method, callback) => {
        this.subscriptions.push({
          method,
          callback
        })
        this.realClient.subscribe(id, method, callback)
      },
      unsubscribe: (method, callback) => {
        this.realClient.unsubscribe(id, method, callback)
      },
      supportsMethod: method => this.realClient.supportsMethod(id, method)
    }
  }
  
  
  getDevice():BaseDevice | null {
    return this.realClient.getDevice()
  }
  
  getAndroidDevice():AndroidDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof AndroidDevice))
      throw new Error("expected android device")
    
    return device as any
  }
  
  getIOSDevice():IOSDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof IOSDevice))
      throw new Error("expected ios device")
    
    return device as any
  }
  
  teardown() {
    // automatically unsubscribe subscriptions
    for (const {method, callback} of this.subscriptions) {
      this.realClient.unsubscribe(this.id, method, callback)
    }
    
    super.teardown()
    
    if (this.realClient.connected) {
      this.realClient.deinitPlugin(this.id)
    }
  }
  
  init() {
    this.realClient.initPlugin(this.id)
    super.init()
  }
}

export class FlipperDevicePluginComponent<Props extends FlipperPluginProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any>
  extends FlipperBasePluginComponent<
    Props,
    State,
    Actions,
    PersistedState
  > implements DevicePluginComponent<
    Props,
    State,
    Actions,
    PersistedState
  > {
  
  static supportsDevice(_device:BaseDevice) {
    throw new Error("supportsDevice is unimplemented in FlipperDevicePlugin class")
  }
  
  readonly device:BaseDevice
  
  constructor(props:Props) {
    super(props)
    this.device = props.target as BaseDevice
  }
  
  init() {
    super.init()
  }
  
  getDevice():BaseDevice | null {
    return this.device;
  }
}
