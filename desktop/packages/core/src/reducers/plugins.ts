/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {getDevIPCClient} from "@flipper/common"
import {DevicePlugin, isDevicePlugin, isPlugin, Plugin, PluginError} from "../PluginTypes"
export type State = {
  devicePlugins: Map<string, DevicePlugin>,
  clientPlugins: Map<string, Plugin>,
  gatekeepedPlugins: Array<Plugin>,
  disabledPlugins: Array<Plugin>,
  failedPlugins: Array<PluginError>
}

export type Action =
| {
  type: "LOAD_PLUGINS",
  payload: {}
}
  | {
      type: "REGISTER_PLUGINS",
      payload: Array<Plugin>
    }
  | {
      type: "GATEKEEPED_PLUGINS",
      payload: Array<Plugin>
    }
  | {
      type: "DISABLED_PLUGINS",
      payload: Array<Plugin>
    }
  | {
      type: "FAILED_PLUGINS",
      payload: Array<PluginError>
    }
const INITIAL_STATE: State = {
  devicePlugins: new Map<string, DevicePlugin>(),
  clientPlugins: new Map<string, Plugin>(),
  gatekeepedPlugins: [],
  disabledPlugins: [],
  failedPlugins: []
}
export default function reducer(state: State = INITIAL_STATE, action: Action): State {
  if (action.type === "LOAD_PLUGINS") {
    getDevIPCClient().then(client => client.emit("getPlugins",{}))
  } else if (action.type === "REGISTER_PLUGINS") {
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
  } else if (action.type === "GATEKEEPED_PLUGINS") {
    return { ...state, gatekeepedPlugins: state.gatekeepedPlugins.concat(action.payload) }
  } else if (action.type === "DISABLED_PLUGINS") {
    return { ...state, disabledPlugins: state.disabledPlugins.concat(action.payload) }
  } else if (action.type === "FAILED_PLUGINS") {
    return { ...state, failedPlugins: state.failedPlugins.concat(action.payload) }
  }
  return state
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
