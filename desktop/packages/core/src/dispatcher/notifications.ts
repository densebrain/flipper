/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {getLogger, NotificationEvent, shallowEquals} from "@states/common"
import {oc} from "ts-optchain"
import {ipcRenderer} from "electron"
import {getValue} from "typeguard"

import {Store} from "../reducers/index"
import {Logger} from "../fb-interfaces/Logger"
import {PluginNotification} from "../reducers/NotificationsReducer"
import {selectPlugin} from "../reducers/ConnectionsReducer"
import {setActiveNotifications, updatePluginBlacklist, updateCategoryBlacklist} from "../reducers/NotificationsReducer"
import GK from "../fb-stubs/GK"
import {Plugin} from "../PluginTypes"
import {PluginStatesState} from "../reducers/PluginStatesReducer"
import textContent from "../utils/textContent"
import * as _ from 'lodash'


const log = getLogger(__filename)

export default async function (store:Store, logger:Logger) {
  if (GK.get("states_disable_notifications")) {
    return
  }
  
  const knownNotifications:Set<string> = new Set(), knownPluginStates:Map<string, any> = new Map()
  
  ipcRenderer.on("notificationEvent",
    (_e:any, eventName:NotificationEvent, pluginNotification:PluginNotification, arg:null | string | number) => {
      if (eventName === "click" || (eventName === "action" && arg === 0)) {
        store.dispatch(selectPlugin({
          selectedPlugin: "notifications", selectedApp: null, deepLinkPayload: pluginNotification.notification.id
        }))
      } else if (eventName === "action") {
        if (arg === 1 && pluginNotification.notification.category) {
          // Hide similar (category)
          logger.track("usage", "notification-hide-category", pluginNotification)
          const {category} = pluginNotification.notification
          const {blacklistedCategories} = store.getState().notifications
          
          if (category && blacklistedCategories.indexOf(category) === -1) {
            store.dispatch(updateCategoryBlacklist([...blacklistedCategories, category]))
          }
        } else if (arg === 2) {
          // Hide plugin
          logger.track("usage", "notification-hide-plugin", pluginNotification)
          const {blacklistedPlugins} = store.getState().notifications
          
          if (blacklistedPlugins.indexOf(pluginNotification.pluginId) === -1) {
            store.dispatch(updatePluginBlacklist([...blacklistedPlugins, pluginNotification.pluginId]))
          }
        }
      }
    })
  
  let existingPluginStates:PluginStatesState | null = null
  
  store.subscribe(() => {
    const state = store.getState(), {plugins: statePlugins, pluginStates} = state, {clientPlugins, devicePlugins} = statePlugins
    
    if (!pluginStates || (existingPluginStates && shallowEquals(existingPluginStates, pluginStates))) return
    
    existingPluginStates = pluginStates
    
    const pluginMap:Map<string, Plugin> = new Map([
      ...clientPlugins.entries(), ...devicePlugins.entries()
    ]), notifications = Object
      .entries(pluginStates)
      .filter(([key, pluginState]) => !knownPluginStates.has(key) || knownPluginStates.get(key) !== pluginState)
      .map(([key, pluginState]) => {
        knownPluginStates.set(key, pluginState)
        const split = key.split("#")
        const pluginId = split.pop()
        const client = split.join("#")
        const persistingPlugin:Plugin | null | undefined = pluginMap.get(pluginId)
        
        const getActiveNotifications = getValue(() => persistingPlugin.componentClazz.getActiveNotifications, null)
        return !getActiveNotifications ? null : {
          client, pluginId, notifications: getActiveNotifications(pluginState),
        }
      })
      .filter(Boolean)
    
    if (!notifications.length) {
      return
    }
    
    store.dispatch(setActiveNotifications(notifications))
    
    const
      {blacklistedPlugins, blacklistedCategories} = state.notifications,
      newNotifications = _.flatten(notifications.map(({client, pluginId, notifications}) => notifications.map(
        notification => ({client, pluginId, notification}))))
        .filter(n =>
          !knownNotifications.has(n.notification.id) &&
            !blacklistedPlugins.includes(n.pluginId) &&
            (
              !n.notification.category || blacklistedCategories.includes(n.notification.category)
            )
        )
    
    newNotifications
      .forEach((n:PluginNotification) => {
        const event = {
          payload: {
            title: n.notification.title,
            body: textContent(n.notification.message),
            actions: [
              {
                type: "button", text: "Show"
              }, {
                type: "button", text: "Hide similar"
              }, {
                type: "button", text: `Hide all ${oc(pluginMap.get(n.pluginId)).title(null) || ""}`
              }
            ], closeButtonText: "Hide"
          },
          closeAfter: 10000,
          pluginNotification: n
        }
        
        log.info("Pushing event to main: sendNotification", event)
        
        ipcRenderer.send("sendNotification", event)
        logger.track("usage", "native-notification", n.notification)
        knownNotifications.add(n.notification.id)
      })
  })
}
