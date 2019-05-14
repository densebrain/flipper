/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import "../GlobalTypes"
import { Store } from "../reducers/index"
import {getLogger, Logger} from "../fb-interfaces/Logger"
//import { FlipperPlugin, FlipperDevicePlugin } from "../plugin"
import { State } from "../reducers/plugins"
//import * as React from "react"
//import * as ReactDOM from "react-dom"

import { registerPlugins, addGatekeepedPlugins, addDisabledPlugins, addFailedPlugins } from "../reducers/plugins"
import { remote } from "electron"
import GK from "../fb-stubs/GK"
import { setupMenuBar } from "../MenuBar"
import path from "path"
import { default as config } from "../utils/processConfig"
import isProduction from "../utils/isProduction"
import {isPlugin, Plugin, PluginError, PluginPropNamesCopied, validatePlugin} from "../PluginTypes"


import {Run} from "../utils/runtime"

const log = getLogger(__filename)

export default (store: Store, _logger: Logger) => {
  // expose Flipper and exact globally for dynamically loaded plugins
  //const globalObject = typeof window === "undefined" ? global : window
  
  // globalObject.React = React
  // globalObject.ReactDOM = ReactDOM
  // globalObject.Flipper = require("../index")
  const gatekeepedPlugins: Array<Plugin> = []
  const disabledPlugins: Array<Plugin> = []
  const failedPlugins: Array<PluginError> = []
  const initialPlugins: Array<Plugin> = [
    ...getBundledPlugins(),
    ...getDynamicPlugins()
  ]
    .filter(checkDisabled(disabledPlugins))
    .filter(checkGK(gatekeepedPlugins))
    .map(requirePlugin(failedPlugins))
    .filter(Boolean)
  
  store.dispatch(addGatekeepedPlugins(gatekeepedPlugins))
  store.dispatch(addDisabledPlugins(disabledPlugins))
  store.dispatch(addFailedPlugins(failedPlugins))
  store.dispatch(registerPlugins(initialPlugins))
  let state: State | null | undefined = null
  store.subscribe(() => {
    const newState = store.getState().plugins

    if (state !== newState) {
      setupMenuBar([...newState.devicePlugins.values(), ...newState.clientPlugins.values()], store)
    }

    state = newState
  })
}

function getBundledPlugins(): Array<Plugin> {
  if (!isProduction()) {
    // Plugins are only bundled in production builds
    return []
  } // DefaultPlugins that are included in the bundle.
  // List of defaultPlugins is written at build time

  const pluginPath = process.env.BUNDLED_PLUGIN_PATH || path.join(__dirname, "defaultPlugins")
  let bundledPlugins: Array<Plugin> = []

  try {
    bundledPlugins = global.electronRequire(path.join(pluginPath, "index.json"))
  } catch (e) {
    console.error(e)
  }

  return bundledPlugins.map(plugin => ({ ...plugin, out: path.join(pluginPath, plugin.entry) }))
}

export function getDynamicPlugins() {
  let dynamicPlugins: Array<Plugin> = []

  try {
    dynamicPlugins = JSON.parse(
      remote.process.env.PLUGINS || process.env.PLUGINS || "[]"
    )
  } catch (e) {
    log.error(e)
  }

  return dynamicPlugins
}
export const checkGK = (gatekeepedPlugins: Array<Plugin>) => (plugin: Partial<Plugin>): boolean => {
  if (!plugin.gatekeeper || !isPlugin(plugin)) {
    return true
  }

  const result = GK.get(plugin.gatekeeper)

  if (!result) {
    gatekeepedPlugins.push(plugin)
    console.warn(
      'Plugin %s will be ignored as user is not part of the gatekeeper "%s".',
      plugin.name,
      plugin.gatekeeper
    )
  }

  return result
}
export const checkDisabled = (disabledPlugins: Array<Plugin>) => (plugin: Partial<Plugin>): boolean => {
  if (!isPlugin(plugin))
    return false
  
  let disabledList: Set<string> = new Set()

  try {
    disabledList = config().disabledPlugins
  } catch (e) {
    console.error(e)
  }

  if (disabledList.has(plugin.id)) {
    disabledPlugins.push(plugin)
  }

  return !disabledList.has(plugin.id)
}


export const requirePlugin = (
  failedPlugins: Array<PluginError>,
  reqFn: NodeRequire = global.electronRequire
) => {
  return (failedPlugin: Partial<Plugin>): Plugin | null | undefined => {
    const {pkg, path: pluginPath} = failedPlugin
    
    let plugin:Plugin | null = null
    try {
      
      const pluginFlow:Array<[() => (true | Error), (err?:Error | null | undefined) => string]> = [
        [() => !!pkg.main ? true : new Error(`Main not specified`), err => `Main not defined in ${pluginPath}: ${err.message}`],
        [() => Run(() => {
          try {
            plugin = reqFn(pkg.main)
            if ((plugin as any).default) {
              plugin = (plugin as any).default
            }
            
            return validatePlugin(plugin) ? true : new Error(`Unable to validate plugin`)
          } catch (err) {
            log.error(err)
            return err
          }
        }), err => `Unable to load plugin: ${err.message}`]
      ]
      
      for (const [checkFn, errFn] of pluginFlow) {
        const answer = checkFn()
        if (answer !== true) {
          throw new Error(errFn(answer))
        }
      }
      PluginPropNamesCopied.forEach(key => {
        if (key === "name") {
          plugin.id = plugin.id || pkg.name
        } else {
          plugin[key] = plugin[key] || (pkg as any )[key]
        }
        
        
      })
      return plugin
    } catch (e) {
      failedPlugins.push([pkg, plugin, e, e.message])
      log.error(pkg, e)
      return null
    }
  }
}
