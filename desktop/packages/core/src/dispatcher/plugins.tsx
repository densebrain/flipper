/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { getDevIPCClient } from "@states/common"
import { remote } from "electron"
import * as Path from "path"
import { getLogger, Logger } from "../fb-interfaces/Logger"
//import GK from "../fb-stubs/GK"
import "../GlobalTypes"
import { setupMenuBar } from "../MenuBar"
import { PluginLoader } from "../plugin/PluginLoader"
import {
  Plugin,
  PluginError,
  PluginMetadata,
  PluginPropNamesCopied
} from "../PluginTypes"
import { Store } from "../reducers/index"
//import { StatesPlugin, StatesDevicePlugin } from "../plugin"
import {
  addDisabledPlugins,
  addFailedPlugins,
  addGatekeepedPlugins,
  registerPlugins,
  State
} from "../reducers/PluginReducer"
import isProduction from "../utils/isProduction"
import { default as config } from "../utils/processConfig"
//import * as React from "react"
//import * as ReactDOM from "react-dom"

const log = getLogger(__filename)

export default async function(store: Store, _logger: Logger) {
  // expose States and exact globally for dynamically loaded plugins
  //const globalObject = typeof window === "undefined" ? global : window

  // globalObject.React = React
  // globalObject.ReactDOM = ReactDOM
  // globalObject.States = require("../index")
  const gatekeepedPlugins: Array<Plugin> = []
  const disabledPlugins: Array<Plugin> = []
  const failedPlugins: Array<PluginError> = []
  const initialPlugins: Array<Plugin> = (await Promise.all(
    [...getBundledPlugins(), ...getDynamicPlugins()]
      .filter(checkDisabled(disabledPlugins))
      //.filter(checkGK(gatekeepedPlugins))
      .map(makeRequirePlugin(failedPlugins))
  )).filter(Boolean)

  store.dispatch(addGatekeepedPlugins(gatekeepedPlugins))
  store.dispatch(addDisabledPlugins(disabledPlugins))
  store.dispatch(addFailedPlugins(failedPlugins))
  store.dispatch(registerPlugins(initialPlugins))
  
  let state: State | null | undefined = null

  store.subscribe(() => {
    const newState = store.getState().plugins

    if (state !== newState) {
      setupMenuBar(
        [
          ...newState.devicePlugins.values(),
          ...newState.clientPlugins.values()
        ],
        store
      )
    }

    state = newState
  })

  if (isDev) {
    const ipcClient = await getDevIPCClient()
    ipcClient.on(
      "pluginUpdated",
      (
        _ipc,
        _type,
        {
          payload: {
            plugin: { id, path, assets }
          }
        }
      ) => {
        path = path.replace(/\@states\//,'')
        
        log.info("Plugin loading", id, path, assets)
        loadPlugin(store, { id, path })
      }
    )

    ipcClient.on("getPlugins", (_ipc, _type, { payload: { plugins } }) => {
      log.info("getPlugins response", plugins)

      loadPlugin(store, ...plugins)
    })
  }
}

async function loadPlugin(store: Store, ...metadata: PluginMetadata[]) {
  const failedPlugins = Array<PluginError>(),
    requirePlugin = makeRequirePlugin(failedPlugins),
    //state = store.getState(),
    plugins = (await Promise.all(
      metadata
        // .filter(md =>
        //   !state.plugins.devicePlugins.has(md.id) &&
        //   !state.plugins.clientPlugins.has(md.id))
        .map(async md => {
          try {
            return await requirePlugin(md)
          } catch (err) {
            log.error(`Unable to load plugin`, md)
            return null
          }
        })
    )).filter(Boolean)

  if (failedPlugins.length) {
    store.dispatch(addFailedPlugins(failedPlugins))
  }

  if (plugins.length) {
    store.dispatch(registerPlugins(plugins))
  }
}

function getBundledPlugins(): Array<PluginMetadata> {
  if (!isProduction()) {
    // Plugins are only bundled in production builds
    return []
  } // DefaultPlugins that are included in the bundle.
  // List of defaultPlugins is written at build time

  const
    pluginNames:Array<string> = process.env.BundledPluginNames as any,
    pluginsDir = Path.join(process.resourcesPath, "app.asar", "plugins")
  
  return pluginNames.map(name => ({
    id: `@states/${name}`,
    path: Path.join(pluginsDir, name)
  }))
  // //process.env.BUNDLED_PLUGIN_PATH || path.join(__dirname, "defaultPlugins")
  //
  // let bundledPlugins: Array<PluginMetadata> = []
  //
  // try {
  //   bundledPlugins = global.electronRequire(path.join(pluginPath, "index.json"))
  // } catch (e) {
  //   console.error(e)
  // }
  //
  // return bundledPlugins.map(plugin => ({
  //   ...plugin,
  //   out: path.join(pluginPath, plugin.entry)
  // }))
}

export function getDynamicPlugins():Array<PluginMetadata> {
  let dynamicPlugins: Array<PluginMetadata> = []

  try {
    dynamicPlugins = JSON.parse(
      remote.process.env.PLUGINS || process.env.PLUGINS || "[]"
    )
  } catch (e) {
    log.error(e)
  }

  return dynamicPlugins
}

// export const checkGK = (gatekeepedPlugins: Array<Plugin>) => (
//   plugin: PluginMetadata
// ): boolean => {
//   if (!plugin.gatekeeper || !isPlugin(plugin)) {
//     return true
//   }
//
//   const result = GK.get(plugin.gatekeeper)
//
//   if (!result) {
//     gatekeepedPlugins.push(plugin)
//     console.warn(
//       'Plugin %s will be ignored as user is not part of the gatekeeper "%s".',
//       plugin.name,
//       plugin.gatekeeper
//     )
//   }
//
//   return result
// }
export const checkDisabled = (disabledPlugins: Array<PluginMetadata>) => (
  pluginMetadata: PluginMetadata
): boolean => {
  //if (!isPlugin(plugin)) return false

  let disabledList: Set<string> = new Set()

  try {
    disabledList = config().disabledPlugins
  } catch (e) {
    console.error(e)
  }

  if (disabledList.has(pluginMetadata.id)) {
    disabledPlugins.push(pluginMetadata)
  }

  return !disabledList.has(pluginMetadata.id)
}

/**
 * Create a require function for a given
 * point in the store state
 *
 * @param {Array<PluginError>} failedPlugins
 * @returns {(pluginExport: Partial<Plugin>) => Promise<Plugin | null | undefined>}
 */
export const makeRequirePlugin = (failedPlugins: Array<PluginError>) => async (
  pluginMetadata: PluginMetadata
): Promise<Plugin | null | undefined> => {
  
  const { id, pkg, path: pluginPath } = pluginMetadata

  let plugin: Plugin | null = null
  try {
    const loader = await PluginLoader.load({ id, path: pluginPath }),
      { pkg, plugin } = loader

    PluginPropNamesCopied.forEach(key => {
      if (key === "name") {
        plugin.id = plugin.id || pkg.name
      } else {
        plugin[key] = plugin[key] || (pkg as any)[key]
      }
    })
    return plugin
  } catch (e) {
    failedPlugins.push([pkg, plugin, e, e.message])
    log.error(pkg, e)
    return null
  }
}
