/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {getInstance as getLogger, getInstance} from "../fb-stubs/Logger"
import {Store} from "../reducers"
import {default as BaseDevice, DeviceExport} from "../devices/BaseDevice"
import {
  pluginKey,
  PluginStatesState as PluginStatesState,
  PluginStatesState as PluginStates
} from "../reducers/pluginStates"
import {PluginNotification} from "../reducers/notifications"
import {ClientExport, default as Client} from "../Client"
import {default as ArchivedDevice} from "../devices/ArchivedDevice"
import fs from "fs"
import uuid from "uuid"
import {remote} from "electron"
import {deserialize, serialize} from "./serialization"
import {readCurrentRevision} from "./packageMetadata"
import {tryCatchReportPlatformFailures} from "./metrics"
import {promisify} from "util"
import promiseTimeout from "./promiseTimeout"
import {callClient, DevicePlugin, Plugin} from "../PluginTypes"

export const IMPORT_FLIPPER_TRACE_EVENT = "import-flipper-trace"
export const EXPORT_FLIPPER_TRACE_EVENT = "export-flipper-trace"
export type ExportType = {
  fileVersion: string,
  flipperReleaseRevision: string | null | undefined,
  clients: Array<ClientExport>,
  device: DeviceExport | null | undefined,
  store: {
    pluginStates: PluginStates,
    activeNotifications: Array<PluginNotification>
  }
}
export function processClients(clients: Array<ClientExport>, serial: string): Array<ClientExport> {
  return clients.filter(client => client.query.device_id === serial)
}
export function processPluginStates(
  clients: Array<ClientExport>,
  serial: string,
  allPluginStates: PluginStatesState,
  devicePlugins: Map<string, DevicePlugin>
): PluginStatesState {
  let pluginStates = {}

  for (let key in allPluginStates) {
    let keyArray = key.split("#")
    const pluginName = keyArray.pop()
    const filteredClients = clients.filter(client => {
      // Remove the last entry related to plugin
      return client.id.includes(keyArray.join("#"))
    })

    if (filteredClients.length > 0 || (devicePlugins.has(pluginName) && serial === keyArray[0])) {
      // There need not be any client for device Plugins
      pluginStates = { ...pluginStates, [key]: allPluginStates[key] }
    }
  }

  return pluginStates
}
export function processNotificationStates(
  clients: Array<ClientExport>,
  serial: string,
  allActiveNotifications: Array<PluginNotification>,
  devicePlugins: Map<string, DevicePlugin>
): Array<PluginNotification> {
  let activeNotifications = allActiveNotifications.filter(notif => {
    const filteredClients = clients.filter(client => (notif.client ? client.id.includes(notif.client) : false))
    return filteredClients.length > 0 || (devicePlugins.has(notif.pluginId) && serial === notif.client) // There need not be any client for device Plugins
  })
  return activeNotifications
}

const addSaltToDeviceSerial = async (
  salt: string,
  device: BaseDevice,
  clients: Array<ClientExport>,
  pluginStates: PluginStatesState,
  pluginNotification: Array<PluginNotification>
): Promise<ExportType> => {
  const { serial } = device
  const newSerial = salt + "-" + serial
  const newDevice = new ArchivedDevice(newSerial, device.deviceType, device.title, device.os, device.getLogs())
  const updatedClients = clients.map((client: ClientExport) => {
    return { ...client, id: client.id.replace(serial, newSerial), query: { ...client.query, device_id: newSerial } }
  })
  const updatedPluginStates: PluginStatesState = {}

  for (let key in pluginStates) {
    if (!key.includes(serial)) {
      throw new Error(`Error while exporting, plugin state (${key}) does not have ${serial} in its key`)
    }

    const pluginData = pluginStates[key]
    key = key.replace(serial, newSerial)
    updatedPluginStates[key] = pluginData
  }

  const updatedPluginNotifications = pluginNotification.map(notif => {
    if (!notif.client || !notif.client.includes(serial)) {
      throw new Error(`Error while exporting, plugin state (${notif.pluginId}) does not have ${serial} in it`)
    }

    return { ...notif, client: notif.client.replace(serial, newSerial) }
  })
  const revision: string | null | undefined = await readCurrentRevision()
  return {
    fileVersion: remote.app.getVersion(),
    flipperReleaseRevision: revision,
    clients: updatedClients,
    device: newDevice.toJSON(),
    store: {
      pluginStates: updatedPluginStates,
      activeNotifications: updatedPluginNotifications
    }
  }
}

export const processStore = async (
  activeNotifications: Array<PluginNotification>,
  device: BaseDevice | null | undefined,
  pluginStates: PluginStatesState,
  clients: Array<ClientExport>,
  devicePlugins: Map<string, DevicePlugin>,
  salt: string
): Promise<ExportType | null | undefined> => {
  if (device) {
    const { serial } = device
    const processedClients = processClients(clients, serial)
    let processedPluginStates = processPluginStates(processedClients, serial, pluginStates, devicePlugins)
    const processedActiveNotifications = processNotificationStates(
      processedClients,
      serial,
      activeNotifications,
      devicePlugins
    ) // Adding salt to the device id, so that the device_id in the device list is unique.

    const exportFlipperData = await addSaltToDeviceSerial(
      salt,
      device,
      processedClients,
      processedPluginStates,
      processedActiveNotifications
    )
    return exportFlipperData
  }

  return null
}

export interface StoreExport {
  exportData: ExportType | null | undefined,
  errorArray: Array<Error>
}

export async function getStoreExport(
  store: Store
): Promise<StoreExport> {
  const state = store.getState()
  const { clients } = state.connections
  const { pluginStates } = state
  const { plugins } = state
  const newPluginState = { ...pluginStates } // TODO: T39612653 Make Client mockable. Currently rsocket logic is tightly coupled.
  // Not passing the entire state as currently Client is not mockable.

  const pluginsMap = new Map<string, Plugin>()
  plugins.clientPlugins.forEach((val, key) => {
    pluginsMap.set(key, val)
  })
  plugins.devicePlugins.forEach((val, key) => {
    pluginsMap.set(key, val)
  })
  const errorArray: Array<Error> = []

  for (let client of clients) {
    for (let plugin of client.plugins) {
      const pluginClass: Plugin | null | undefined = plugin
        ? pluginsMap.get(plugin)
        : null
      const exportState = pluginClass ? pluginClass.componentClazz.exportPersistedState : null

      if (exportState) {
        const key = pluginKey(client.id, plugin)

        try {
          const data = await promiseTimeout(
            120000, // Timeout in 2 mins
            exportState(callClient(client, plugin), newPluginState[key], store),
            `Timed out while collecting data for ${plugin}`
          )
          newPluginState[key] = data
        } catch (e) {
          errorArray.push(e)
        }
      }
    }
  }

  const { activeNotifications } = store.getState().notifications
  const { selectedDevice } = store.getState().connections
  const { devicePlugins } = store.getState().plugins
  const exportData = await processStore(
    activeNotifications,
    selectedDevice,
    newPluginState,
    clients.map(client => client.toJSON()),
    devicePlugins,
    uuid.v4()
  )
  return {
    exportData,
    errorArray
  }
}
export function exportStore(
  store: Store
): Promise<{
  serializedString: string,
  errorArray: Array<Error>
}> {
  getLogger().track("usage", EXPORT_FLIPPER_TRACE_EVENT)
  return new Promise(async (resolve, reject) => {
    const { exportData, errorArray } = await getStoreExport(store)

    if (!exportData) {
      console.error("Make sure a device is connected")
      reject("No device is selected")
    }

    const serializedString = serialize(exportData)

    if (serializedString.length <= 0) {
      reject("Serialize function returned empty string")
    }

    resolve({
      serializedString,
      errorArray
    })
  })
}
export const exportStoreToFile = (
  exportFilePath: string,
  store: Store
): Promise<{
  errorArray: Array<Error>
}> => {
  return exportStore(store).then(({ serializedString, errorArray }) => {
    return promisify(fs.writeFile)(exportFilePath, serializedString).then(() => {
      return {
        errorArray
      }
    })
  })
}
export function importDataToStore(data: string, store: Store) {
  getLogger().track("usage", IMPORT_FLIPPER_TRACE_EVENT)
  
  // TODO: Type all of this
  const json = deserialize(data) as any
  const { device, clients } = json
  const { serial, deviceType, title, os, logs } = device
  const archivedDevice = new ArchivedDevice(serial, deviceType, title, os, logs ? logs : [])
  const devices = store.getState().connections.devices
  const matchedDevices = devices.filter(availableDevice => availableDevice.serial === serial)

  if (matchedDevices.length > 0) {
    store.dispatch({
      type: "SELECT_DEVICE",
      payload: matchedDevices[0]
    })
    return
  }

  store.dispatch({
    type: "REGISTER_DEVICE",
    payload: archivedDevice
  })
  store.dispatch({
    type: "SELECT_DEVICE",
    payload: archivedDevice
  })
  const { pluginStates } = json.store
  const keys = Object.keys(pluginStates)
  clients.forEach((client: any) => {
    const clientPlugins = keys
      .filter(key => {
        const arr = key.split("#")
        arr.pop()
        const clientPlugin = arr.join("#")
        return client.id === clientPlugin
      })
      .map((client:any) => client.split("#").pop())
    store.dispatch({
      type: "NEW_CLIENT",
      payload: new Client(client.id, client.query, null, getInstance(), store, clientPlugins)
    })
  })
  keys.forEach(key => {
    store.dispatch({
      type: "SET_PLUGIN_STATE",
      payload: {
        pluginKey: key,
        state: pluginStates[key]
      }
    })
  })
}
export const importFileToStore = (file: string, store: Store) => {
  fs.readFile(file, "utf8", (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    importDataToStore(data, store)
  })
}
export function showOpenDialog(store: Store) {
  remote.dialog.showOpenDialog(
    {
      properties: ["openFile"]
    },
    (files: Array<string>) => {
      if (files !== undefined && files.length > 0) {
        tryCatchReportPlatformFailures(() => {
          importFileToStore(files[0], store)
        }, `${IMPORT_FLIPPER_TRACE_EVENT}:UI`)
      }
    }
  )
}
