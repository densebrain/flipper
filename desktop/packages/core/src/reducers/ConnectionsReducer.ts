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
import Client from "../Client"
import { DefaultPluginId } from "../Constants"
import { UninitializedClient } from "../UninitializedClient"
import { isEqual } from "lodash"
import iosUtil from "../fb-stubs/iOSContainerUtility" // $FlowFixMe perf_hooks is a new API in node
import * as _ from "lodash"

import { performance } from "perf_hooks"
import { getLogger } from "@stato/common"
import {stato as Models} from "@stato/models"

const log = getLogger(__filename)

export type State = {
  devices: Array<BaseDevice>
  androidEmulators: Array<string>
  selectedDevice: BaseDevice | null
  selectedPlugin: string | null
  selectedApp: string | null
  userPreferredDevice: string | null
  userPreferredPlugin: string | null
  userPreferredApp: string | null
  error: string | null
  clients: Array<Client>
  uninitializedClients: Array<UninitializedClient>
  deepLinkPayload: string | null | undefined
}

export interface SelectPluginPayload {
  selectedPlugin: string | null
  selectedApp?: string | null
  deepLinkPayload?: string | null
}

export type Action =
  | {
      type: "UNREGISTER_DEVICES"
      payload: Set<string>
    }
  | {
      type: "REGISTER_DEVICE"
      payload: BaseDevice
    }
  | {
      type: "REGISTER_ANDROID_EMULATORS"
      payload: Array<string>
    }
  | {
      type: "SELECT_DEVICE"
      payload: BaseDevice
    }
  | {
      type: "SELECT_PLUGIN"
      payload: SelectPluginPayload
    }
  | {
      type: "SELECT_USER_PREFERRED_PLUGIN"
      payload: string
    }
  | {
      type: "SERVER_ERROR"
      payload: string | null
    }
  | {
      type: "NEW_CLIENT"
      payload: Client
    }
  | {
      type: "NEW_CLIENT_SANITY_CHECK"
      payload: Client
    }
  | {
      type: "CLIENT_REMOVED"
      payload: string
    }
  | {
      type: "PREFER_DEVICE"
      payload: string
    }
  | {
      type: "START_CLIENT_SETUP"
      payload: UninitializedClient
    }
  | {
      type: "FINISH_CLIENT_SETUP"
      payload: {
        client: UninitializedClient
        deviceId: string
      }
    }
  | {
      type: "CLIENT_SETUP_ERROR"
      payload: {
        client: UninitializedClient
        error: Error
      }
    }
const DEFAULT_PLUGIN = DefaultPluginId
const INITAL_STATE: State = {
  devices: [],
  androidEmulators: [],
  selectedDevice: null,
  selectedApp: null,
  selectedPlugin: DEFAULT_PLUGIN,
  userPreferredDevice: null,
  userPreferredPlugin: null,
  userPreferredApp: null,
  error: null,
  clients: [],
  uninitializedClients: [],
  deepLinkPayload: null
}

const reducer = (state: State = INITAL_STATE, action: Action): State => {
  switch (action.type) {
    case "SELECT_DEVICE": {
      const { payload } = action
      return {
        ...state,
        selectedApp: null,
        selectedPlugin: DEFAULT_PLUGIN,
        selectedDevice: payload,
        userPreferredDevice: payload.title
      }
    }

    case "REGISTER_ANDROID_EMULATORS": {
      const { payload } = action
      return { ...state, androidEmulators: payload }
    }

    case "REGISTER_DEVICE": {
      const { payload } = action
      const devices = state.devices.concat(payload)
      let { selectedDevice, selectedPlugin } = state // select the default plugin

      let selection: SelectPluginPayload = {
        selectedApp: null,
        selectedPlugin: DEFAULT_PLUGIN
      }

      if (!selectedDevice) {
        selectedDevice = payload

        if (selectedPlugin) {
          // We already had a plugin selected, but no device. This is happening
          // when the Client connected before the Device.
          selection = {} as any
        }
      } else if (payload.title === state.userPreferredDevice) {
        selectedDevice = payload
      } else {
        // We didn't select the newly connected device, so we don't want to
        // change the plugin.
        selection = {} as any
      }

      return checkSupportedDevice({
        ...state,
        devices,
        // select device if none was selected before
        selectedDevice,
        ...selection
      })
    }

    case "UNREGISTER_DEVICES": {
      const { payload } = action
      const { selectedDevice } = state
      let selectedDeviceWasRemoved = false
      const devices = state.devices.filter((device: BaseDevice) => {
        if (payload.has(device.serial)) {
          if (selectedDevice === device) {
            // removed device is the selected
            selectedDeviceWasRemoved = true
          }

          return false
        } else {
          return true
        }
      })
      let selection = {}

      if (selectedDeviceWasRemoved) {
        selection = {
          selectedDevice: devices[devices.length - 1],
          selectedApp: null,
          selectedPlugin: DEFAULT_PLUGIN
        }
      }

      return checkSupportedDevice({ ...state, devices, ...selection })
    }

    case "SELECT_PLUGIN": {
      const { payload } = action
      const { selectedPlugin, selectedApp } = payload

      if (selectedPlugin) {
        performance.mark(`activePlugin-${selectedPlugin}`)
      }

      return {
        ...state,
        ...payload,
        userPreferredApp: selectedApp || state.userPreferredApp,
        userPreferredPlugin: selectedPlugin
      }
    }

    case "SELECT_USER_PREFERRED_PLUGIN": {
      const { payload } = action
      return { ...state, userPreferredPlugin: payload }
    }

    case "NEW_CLIENT": {
      const { payload } = action
      const { userPreferredApp, userPreferredPlugin } = state
      let { selectedApp, selectedPlugin } = state

      if (
        userPreferredApp &&
        userPreferredPlugin &&
        payload.id === userPreferredApp &&
        payload.plugins.includes(userPreferredPlugin)
      ) {
        // user preferred client did reconnect, so let's select it
        selectedApp = userPreferredApp
        selectedPlugin = userPreferredPlugin
      }

      return {
        ...state,
        clients: state.clients.concat(payload),
        uninitializedClients: state.uninitializedClients.filter(c => {
          return (
            c.deviceId !== payload.query.nodeId ||
            c.metadata.appName !== payload.query.appName
          )
        }),
        selectedApp,
        selectedPlugin
      }
    }

    case "NEW_CLIENT_SANITY_CHECK": {
      const { payload } = action // Check for clients initialised when there is no matching device

      const clientIsStillConnected = state.clients.filter(
        client => client.id == payload.query.nodeId
      )

      if (clientIsStillConnected) {
        const matchingDeviceForClient = state.devices.filter(
          device => payload.query.nodeId === device.serial
        )

        if (matchingDeviceForClient.length === 0) {
          console.error(
            `Client initialised for non-displayed device: ${payload.id}`
          )
        }
      }

      return state
    }

    case "CLIENT_REMOVED": {
      const { payload } = action
      let selected = {} as any

      if (state.selectedApp === payload) {
        selected.selectedApp = null
        selected.selectedPlugin = DEFAULT_PLUGIN
      }

      return {
        ...state,
        ...selected,
        clients: state.clients.filter((client: Client) => client.id !== payload)
      }
    }

    case "PREFER_DEVICE": {
      const { payload: userPreferredDevice } = action
      return { ...state, userPreferredDevice }
    }

    case "SERVER_ERROR": {
      const { payload } = action
      return { ...state, error: payload }
    }

    case "START_CLIENT_SETUP": {
      const { payload } = action
      return {
        ...state,
        uninitializedClients: state.uninitializedClients
          .filter(entry => !isEqual(entry.metadata, payload.metadata))
          .concat([
            {
              ...payload
            }
          ])
          .sort((a, b) => a.metadata.appName.localeCompare(b.metadata.appName))
      }
    }

    case "FINISH_CLIENT_SETUP": {
      const { payload } = action
      return {
        ...state,
        uninitializedClients: state.uninitializedClients
          .map(c =>
            isEqual(
              _.omit(c, ["deviceId", "errorMessage"]),
              _.omit(payload, ["deviceId", "errorMessage"])
            )
              ? { ...c, deviceId: payload.deviceId }
              : c
          )
          .sort((a, b) => a.metadata.appName.localeCompare(b.metadata.appName))
      }
    }

    case "CLIENT_SETUP_ERROR": {
      const { payload } = action
      const errorMessage =
        payload.error instanceof Error ? payload.error.message : payload.error,
        {client} = payload
      
      log.error(
        `Client setup error: ${errorMessage} while setting up client: ${
          client.metadata.os
        }:${client.metadata.nodeName}:${client.metadata.appName}`
      )
      return {
        ...state,
        uninitializedClients: state.uninitializedClients
          .map(c =>
            isEqual(c.metadata, client.metadata)
              ? { ...c, errorMessage: errorMessage }
              : c
          )
          .sort((a, b) => a.metadata.appName.localeCompare(b.metadata.appName)),
        error: `Client setup error: ${errorMessage}`
      }
    }

    default:
      return state
  }
}

function checkSupportedDevice(state: State) {
  if (state.selectedDevice) {
    const { selectedDevice } = state

    return {
      ...state,
      error:
        selectedDevice.os === Models.OS.OSIOS &&
        selectedDevice.deviceType === "physical" &&
        !iosUtil.isAvailable()
          ? "iOS Devices are not yet supported"
          : null
    }
  }

  return state
}

export default (state: State = INITAL_STATE, action: Action): State => {
  return checkSupportedDevice(reducer(state, action))
}

/**
 * Select device action
 *
 * @param {BaseDevice} payload
 * @returns {Action}
 */
export const selectDevice = (payload: BaseDevice): Action => ({
  type: "SELECT_DEVICE",
  payload
})

/**
 * Prefer device action
 *
 * @param {string} payload
 * @returns {Action}
 */
export const preferDevice = (payload: string): Action => ({
  type: "PREFER_DEVICE",
  payload
})

/**
 * Select plugin action
 *
 * @param {{selectedPlugin:string | null; selectedApp?:string | null; deepLinkPayload:string | null}} payload
 * @returns {Action}
 */
export const selectPlugin = (payload: {
  selectedPlugin: string | null
  selectedApp?: string | null
  deepLinkPayload: string | null
}): Action => ({
  type: "SELECT_PLUGIN",
  payload
})

/**
 * User preferred plugin
 *
 * @param {string} payload
 * @returns {Action}
 */
export const userPreferredPlugin = (payload: string): Action => ({
  type: "SELECT_USER_PREFERRED_PLUGIN",
  payload
})
