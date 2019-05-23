/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import BaseDevice from "../devices/BaseDevice"
import { PluginStatesState as PluginStatesState } from "../reducers/PluginStatesReducer"
import {PluginModuleExport, PluginType} from "../PluginTypes"
export function getPluginKey(
  selectedApp: string | null | undefined,
  baseDevice: BaseDevice | null | undefined,
  pluginID: string
): string {
  if (selectedApp) {
    return `${selectedApp}#${pluginID}`
  }

  if (baseDevice) {
    // If selected App is not defined, then the plugin is a device plugin
    return `${baseDevice.serial}#${pluginID}`
  }

  return `unknown#${pluginID}`
}
export function getPersistedState<PersistedState = any, P extends PluginModuleExport<any,any,any,PersistedState,any, PluginType.Device | PluginType.Normal> = any>(
  pluginKey: string,
  persistingPlugin:
    | P
    | null
    | undefined,
  pluginStates: PluginStatesState
): PersistedState | null {
  

  return !persistingPlugin ? null : { ...persistingPlugin.componentClazz.defaultPersistedState, ...pluginStates[pluginKey] }
  
}
