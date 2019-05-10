/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {DevicePlugin, isDevicePlugin, Plugin} from "../PluginTypes"
export type State = {
  devicePlugins: Map<string, DevicePlugin>,
  clientPlugins: Map<string, Plugin>,
  gatekeepedPlugins: Array<Plugin>,
  disabledPlugins: Array<Plugin>,
  failedPlugins: Array<[Plugin, string]>
}

export type Action =
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
      payload: Array<[Plugin, string]>
    }
const INITIAL_STATE: State = {
  devicePlugins: new Map(),
  clientPlugins: new Map(),
  gatekeepedPlugins: [],
  disabledPlugins: [],
  failedPlugins: []
}
export default function reducer(state: State = INITIAL_STATE, action: Action): State {
  if (action.type === "REGISTER_PLUGINS") {
    const { devicePlugins, clientPlugins } = state
    action.payload.forEach((p: Plugin) => {
      if (devicePlugins.has(p.id) || clientPlugins.has(p.id)) {
        return
      } // $FlowFixMe Flow doesn't know prototype

      if (isDevicePlugin(p)) {
        // $FlowFixMe Flow doesn't know p must be Class<FlipperDevicePlugin> here
        devicePlugins.set(p.id, p)
      } else {
        // $FlowFixMe Flow doesn't know p must be Class<FlipperPlugin> here
        clientPlugins.set(p.id, p)
      }
    })
    return { ...state, devicePlugins, clientPlugins }
  } else if (action.type === "GATEKEEPED_PLUGINS") {
    return { ...state, gatekeepedPlugins: state.gatekeepedPlugins.concat(action.payload) }
  } else if (action.type === "DISABLED_PLUGINS") {
    return { ...state, disabledPlugins: state.disabledPlugins.concat(action.payload) }
  } else if (action.type === "FAILED_PLUGINS") {
    return { ...state, failedPlugins: state.failedPlugins.concat(action.payload) }
  } else {
    return state
  }
}
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
export const addFailedPlugins = (payload: Array<[Plugin, string]>): Action => ({
  type: "FAILED_PLUGINS",
  payload
})
