/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Store } from "../reducers/index"
import BaseDevice from "../devices/BaseDevice"
import { setPluginState } from "../reducers/PluginStatesReducer"
import { getPersistedState } from "../utils/pluginUtils"
import {DevicePlugin, Plugin} from "../PluginTypes"

export function registerDeviceCallbackOnPlugins(
  store: Store,
  devicePlugins: Map<string, DevicePlugin>,
  clientPlugins: Map<string, Plugin>,
  device: BaseDevice
) {
  const callRegisterDeviceHook = (plugin: Plugin) => {
    const {componentClazz:{onRegisterDevice}} = plugin
    if (onRegisterDevice) {
      onRegisterDevice(store, device, (pluginKey: string, newPluginState: any) => {
        const persistedState = getPersistedState(pluginKey, plugin, store.getState().pluginStates)

        if (newPluginState && newPluginState !== persistedState) {
          store.dispatch(
            setPluginState({
              pluginKey,
              state: newPluginState
            })
          )
        }
      })
    }
  }

  devicePlugins.forEach(callRegisterDeviceHook)
  clientPlugins.forEach(callRegisterDeviceHook)
}
