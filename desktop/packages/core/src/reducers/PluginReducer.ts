/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {getDevIPCClient} from "@states/common"
import {getValue} from "typeguard"
import {DevicePlugin, isDevicePlugin, isPlugin, Plugin, PluginError} from "../PluginTypes"
export type State = {
  devicePlugins: Map<string, DevicePlugin>,
  clientPlugins: Map<string, Plugin>,
  gatekeepedPlugins: Array<Plugin>,
  disabledPlugins: Array<Plugin>,
  failedPlugins: Array<PluginError>
}

export type ActionType = "LOAD_PLUGINS" | "REGISTER_PLUGINS" | "GATEKEEPED_PLUGINS" | "DISABLED_PLUGINS" | "FAILED_PLUGINS"

export type ActionPayload<Type extends ActionType> =
  Type extends "LOAD_PLUGINS" ? {} :
    Type extends "REGISTER_PLUGINS" ? Array<Plugin> :
      Type extends "GATEKEEPED_PLUGINS" ? Array<Plugin> :
        Type extends "DISABLED_PLUGINS" ? Array<Plugin> :
          Array<PluginError>
          

export type ActionMessage<Type extends ActionType> = {
  type: Type
  payload: ActionPayload<Type>
}
export type Action =
  | ActionMessage<"LOAD_PLUGINS">
  | ActionMessage<"REGISTER_PLUGINS">
  | ActionMessage<"GATEKEEPED_PLUGINS">
  | ActionMessage<"DISABLED_PLUGINS">
  | ActionMessage<"FAILED_PLUGINS">

const INITIAL_STATE: State = {
  devicePlugins: new Map<string, DevicePlugin>(),
  clientPlugins: new Map<string, Plugin>(),
  gatekeepedPlugins: [],
  disabledPlugins: [],
  failedPlugins: []
}

type ActionHandler<Type extends ActionType> = <Message extends ActionMessage<Type>>(state:State, action: Message) => State
const actions: {[type in ActionType]: ActionHandler<type>} = {
  LOAD_PLUGINS: (state, _action) => {
    if (isDev) {
      getDevIPCClient().then(client => client.emit("getPlugins", {}))
    }
    return state
  },
  REGISTER_PLUGINS: (state, action) => {
  
    // Map plugins to type maps
    const [newDevicePlugins, newClientPlugins] = action.payload.reduce(([devicePlugins,clientPlugins], p: Plugin) => {
    
      if (state.devicePlugins.get(p.id) !== p || state.clientPlugins.get(p.id) !== p) {
        if (isDevicePlugin(p)) {
          devicePlugins.set(p.id, p)
        } else if (isPlugin(p)) {
          clientPlugins.set(p.id, p)
        }
      }
      return [devicePlugins, clientPlugins]
    },[new Map<string,DevicePlugin>(),new Map<string,Plugin>()] as [Map<string,DevicePlugin>, Map<string, Plugin>])
  
    // If plugins found, then update the state
    if (newDevicePlugins.size || newClientPlugins.size) {
      const
        clientPlugins= new Map(state.clientPlugins.entries()),
        devicePlugins = new Map(state.devicePlugins.entries()),
        newIds = [...newDevicePlugins.keys(),...newClientPlugins.keys()]
    
      newIds.forEach(id => {
        if (clientPlugins.has(id)) clientPlugins.delete(id)
        if (devicePlugins.has(id)) devicePlugins.delete(id)
      })
    
      return {
        ...state,
        devicePlugins: new Map([...devicePlugins.entries(), ...newDevicePlugins.entries()]),
        clientPlugins: new Map([...clientPlugins.entries(), ...newClientPlugins.entries()])
      }
    } else {
      return state
    }
  },
  GATEKEEPED_PLUGINS: (state, action) => {
    return { ...state, gatekeepedPlugins: state.gatekeepedPlugins.concat(action.payload) }
  },
  DISABLED_PLUGINS: (state, action) => {
    return { ...state, disabledPlugins: state.disabledPlugins.concat(action.payload) }
  },
  FAILED_PLUGINS: (state, action) => {
    return { ...state, failedPlugins: state.failedPlugins.concat(action.payload) }
  }
}

export default function reducer(state: State = INITIAL_STATE, action: ActionMessage<ActionType>): State {
  return getValue(() => actions[action.type](state,action as any), state)
}

export const loadPlugins = (): Action => ({
  type: "LOAD_PLUGINS",
  payload: {}
})

export const registerPlugins = (payload: Array<Plugin>): Action => ({
  type: "REGISTER_PLUGINS",
  payload
})
export const addGatekeepedPlugins = (payload: Array<Plugin>): Action => ({
  type: "GATEKEEPED_PLUGINS",
  payload
})
export const addDisabledPlugins = (payload: Array<Plugin>): Action => ({
  type: "DISABLED_PLUGINS",
  payload
})
export const addFailedPlugins = (payload: Array<PluginError>): Action => ({
  type: "FAILED_PLUGINS",
  payload
})
