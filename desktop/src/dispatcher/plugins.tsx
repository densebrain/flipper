/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import "../GlobalTypes"
import { Store } from "../reducers/index"
import { Logger } from "../fb-interfaces/Logger"
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
import {isPlugin, Plugin, PluginPropNamesCopied} from "../PluginTypes"
import {IPackageJSON} from "package-json"

import {Run} from "../utils/runtime"


export default (store: Store, _logger: Logger) => {
  // expose Flipper and exact globally for dynamically loaded plugins
  //const globalObject = typeof window === "undefined" ? global : window
  
  // globalObject.React = React
  // globalObject.ReactDOM = ReactDOM
  // globalObject.Flipper = require("../index")
  const gatekeepedPlugins: Array<Plugin> = []
  const disabledPlugins: Array<Plugin> = []
  const failedPlugins: Array<[IPackageJSON, Plugin | null, Error | null, string]> = []
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

  return bundledPlugins.map(plugin => ({ ...plugin, out: path.join(pluginPath, plugin.out) }))
}

export function getDynamicPlugins() {
  let dynamicPlugins: Array<Plugin> = []

  try {
    dynamicPlugins = JSON.parse(
      remote.process.env.PLUGINS || process.env.PLUGINS || "[]"
    )
  } catch (e) {
    console.error(e)
  }

  return dynamicPlugins
}
export const checkGK = (gatekeepedPlugins: Array<Plugin>) => (plugin: Plugin): boolean => {
  if (!plugin.gatekeeper) {
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
export const checkDisabled = (disabledPlugins: Array<Plugin>) => (plugin: Plugin): boolean => {
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
  failedPlugins: Array<[IPackageJSON, Plugin | null, Error | null, string]>,
  reqFn: NodeRequire = global.electronRequire
) => {
  return (pkg: IPackageJSON, pluginPath: string): Plugin | null | undefined => {
    let plugin:Plugin | null = null
    try {
      
      const pluginErrors:Array<[() => (boolean | Error), (err?:Error | null | undefined) => string]> = [
        [() => !!pkg.main, () => `Main not defined in ${pluginPath}`],
        [() => Run(() => {
          try {
            plugin = reqFn(pkg.main)
            if ((plugin as any).default) {
              plugin = (plugin as any).default
            }
            
            return isPlugin(plugin)
          } catch (err: Error) {
            log.error(err)
          }
        })]
      ]
      
      ;(plugin as Plugin)
      if (!plugin) {
      
      }
      

      if () {
        throw new Error(`Plugin ${plugin.name} is not a FlipperBasePlugin`)
      } // set values from package.json as static variables on class
  
      PluginPropNamesCopied.forEach(key => {
        if (key === "name") {
          plugin.id = plugin.id || pkg.name
        }
        
        
      })
      return plugin
    } catch (e) {
      failedPlugins.push([pkg, plugin, e, e.message])
      console.error(pkg, e)
      return null
    }
  }
}
