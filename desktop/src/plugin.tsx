/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import { App } from "./App"
import Client from "./Client"
import {  MiddlewareAPI } from "./reducers/index"
import React from "react"
import BaseDevice from "./devices/BaseDevice"
import AndroidDevice from "./devices/AndroidDevice"
import IOSDevice from "./devices/IOSDevice"
import { Theme } from "./ui/themes"
import {Notification} from "./PluginTypes"
import {AnyAction} from "redux"
import {
  DevicePluginComponent,
  PluginClient,
  PluginComponent,
  PluginComponentProps,
  PluginTarget
} from "./PluginTypes"
import {KeyboardActionHandler, KeyboardActions} from "./KeyboardTypes"


// const invariant = require("invariant") // This function is intended to be called from outside of the plugin.
// If you want to `call` from the plugin use, this.client.call

export function callClient(client: Client, id: string): (a: string, b: Object | undefined) => Promise<Object> {
  return (method, params) => client.call(id, method, false, params)
}


export type FlipperPluginProps<PersistedState, ExtraProps> = PluginComponentProps<PersistedState, ExtraProps>
export abstract class FlipperBasePlugin<State = any, Actions extends AnyAction = any, PersistedState = any, ExtraProps = any>
  extends React.Component<
  PluginComponentProps<PersistedState, ExtraProps>,
  State
> implements PluginComponent<State, PersistedState, ExtraProps> {
  
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
  
  keyboardActions: KeyboardActions | null = null
  screenshot: string | null = null
  //defaultPersistedState: PersistedState | null = null
  // persistedStateReducer(
  //   persistedState: PersistedState,
  //   _method: string,
  //   _data: Object
  // ): Partial<PersistedState> {
  //   return persistedState || {}
  // }
  
  exportPersistedState(
    _callClient: (a: string, b: Object | null) => Promise<Object>,
    persistedState: PersistedState | null ,
    _store: MiddlewareAPI | null
  ): Promise<PersistedState | null> {
    return Promise.resolve(persistedState)
  }
  
  
  getActiveNotifications(_persistedState: PersistedState): Array<Notification> {
    return []
  }
  
  onRegisterDevice (
    _store: FlipperStore,
    _baseDevice: BaseDevice,
    _setPersistedState: (pluginKey: string, newPluginState: PersistedState | null | undefined) => void
  ): void {
  
  }

  reducers: {
    [actionName: string]: (state: State, actionData: Object) => Partial<State>
  } = {}
  app: App | null = null
  onKeyboardAction: KeyboardActionHandler | null = null

  toJSON() {
    return `<${this.constructor.name}#${(this.constructor as any).id}>`
  } // methods to be overridden by plugins

  init(): void {}

  teardown(): void {}

  computeNotifications(_props: PluginComponentProps<PersistedState, ExtraProps>, _state: State): Array<Notification> {
    return []
  } // methods to be overridden by subclasses

  _init(): void {}

  _teardown(): void {}

  dispatchAction(actionData: Actions) {
    // $FlowFixMe
    const action = this.reducers[actionData.type]

    if (!action) {
      // $FlowFixMe
      throw new ReferenceError(`Unknown action ${actionData.type}`)
    }

    if (typeof action === "function") {
      this.setState(action.call(this, this.state, actionData) as any)
    } else {
      throw new TypeError(`Reducer ${actionData.type} isn't a function`)
    }
  }
}
export abstract class FlipperDevicePlugin<S = any, A extends AnyAction = any, PersistedState = any, ExtraProps = any> extends FlipperBasePlugin<
  S,
  A,
  PersistedState,
  ExtraProps
> {
  device: PluginTarget

  get theme(): Theme {
    return this.props.theme
  }

  constructor(props: PluginComponentProps<PersistedState, ExtraProps>) {
    super(props)
    this.device = props.target
  }

  _init() {
    this.init()
  }

  static supportsDevice(_device: BaseDevice) {
    throw new Error("supportsDevice is unimplemented in FlipperDevicePlugin class")
  }
}
export abstract class FlipperPlugin<State = any, Actions extends AnyAction = any, PersistedState = any, ExtraProps = any> extends FlipperBasePlugin<State, Actions, PersistedState, ExtraProps> implements DevicePluginComponent<State,PersistedState,ExtraProps> {
  
  subscriptions: Array<{
    method: string,
    callback: Function
  }>
  client: PluginClient
  realClient: Client
  
  constructor(props: PluginComponentProps<PersistedState, ExtraProps>) {
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

  

  getDevice(): BaseDevice | null {
    return this.realClient.getDevice()
  }

  getAndroidDevice(): AndroidDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof AndroidDevice))
      throw new Error("expected android device")
    
    return device as any
  }

  getIOSDevice(): IOSDevice | null {
    const device = this.getDevice()
    if (device != null && !(device instanceof IOSDevice))
      throw new Error("expected ios device")
    
    return device as any
  }

  _teardown() {
    // automatically unsubscribe subscriptions
    for (const { method, callback } of this.subscriptions) {
      this.realClient.unsubscribe(this.id, method, callback)
    } // run plugin teardown

    this.teardown()

    if (this.realClient.connected) {
      this.realClient.deinitPlugin(this.id)
    }
  }

  _init() {
    this.realClient.initPlugin(this.id)
    this.init()
  }
}
