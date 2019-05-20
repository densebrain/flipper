/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Store } from "../reducers/index"
import { Logger } from "../fb-interfaces/Logger"
import { PluginNotification } from "../reducers/notifications"
import { ipcRenderer } from "electron"
import { selectPlugin } from "../reducers/connections"
import { setActiveNotifications, updatePluginBlacklist, updateCategoryBlacklist } from "../reducers/notifications"
import { textContent } from "../utils/index"
import GK from "../fb-stubs/GK"
import {DevicePlugin, Plugin} from "../PluginTypes"
import {oc} from "ts-optchain"
type NotificationEvents = "show" | "click" | "close" | "reply" | "action"
export default async function(store: Store, logger: Logger)  {
  if (GK.get("flipper_disable_notifications")) {
    return
  }

  const knownNotifications: Set<string> = new Set()
  const knownPluginStates: Map<string, Object> = new Map()
  ipcRenderer.on(
    "notificationEvent",
    (_e:any, eventName: NotificationEvents, pluginNotification: PluginNotification, arg: null | string | number) => {
      if (eventName === "click" || (eventName === "action" && arg === 0)) {
        store.dispatch(
          selectPlugin({
            selectedPlugin: "notifications",
            selectedApp: null,
            deepLinkPayload: pluginNotification.notification.id
          })
        )
      } else if (eventName === "action") {
        if (arg === 1 && pluginNotification.notification.category) {
          // Hide similar (category)
          logger.track("usage", "notification-hide-category", pluginNotification)
          const { category } = pluginNotification.notification
          const { blacklistedCategories } = store.getState().notifications

          if (category && blacklistedCategories.indexOf(category) === -1) {
            store.dispatch(updateCategoryBlacklist([...blacklistedCategories, category]))
          }
        } else if (arg === 2) {
          // Hide plugin
          logger.track("usage", "notification-hide-plugin", pluginNotification)
          const { blacklistedPlugins } = store.getState().notifications

          if (blacklistedPlugins.indexOf(pluginNotification.pluginId) === -1) {
            store.dispatch(updatePluginBlacklist([...blacklistedPlugins, pluginNotification.pluginId]))
          }
        }
      }
    }
  )
  store.subscribe(() => {
    const { notifications, pluginStates } = store.getState()
    const clientPlugins: Map<string, Plugin> = store.getState().plugins.clientPlugins
    const devicePlugins: Map<string, DevicePlugin> = store.getState().plugins.devicePlugins
    const pluginMap: Map<string, Plugin> = new Map([
      ...clientPlugins,
      ...devicePlugins
    ])
    Object.keys(pluginStates).forEach(key => {
      if (knownPluginStates.get(key) !== pluginStates[key]) {
        knownPluginStates.set(key, pluginStates[key])
        const split = key.split("#")
        const pluginId = split.pop()
        const client = split.join("#")
        const persistingPlugin: Plugin | null | undefined = pluginMap.get(
          pluginId
        )
        
        const getActiveNotifications = oc(persistingPlugin).componentClazz.getActiveNotifications(null)
        if (getActiveNotifications) {
          store.dispatch(
            setActiveNotifications({
              notifications: getActiveNotifications(pluginStates[key]),
              client,
              pluginId
            })
          )
        }
      }
    })
    const { activeNotifications, blacklistedPlugins, blacklistedCategories } = notifications
    activeNotifications.forEach((n: PluginNotification) => {
      if (
        store.getState().connections.selectedPlugin !== "notifications" &&
        !knownNotifications.has(n.notification.id) &&
        blacklistedPlugins.indexOf(n.pluginId) === -1 &&
        (!n.notification.category || blacklistedCategories.indexOf(n.notification.category) === -1)
      ) {
        ipcRenderer.send("sendNotification", {
          payload: {
            title: n.notification.title,
            body: textContent(n.notification.message),
            actions: [
              {
                type: "button",
                text: "Show"
              },
              {
                type: "button",
                text: "Hide similar"
              },
              {
                type: "button",
                text: `Hide all ${oc(pluginMap.get(n.pluginId)).title(null) || ""}`
              }
            ],
            closeButtonText: "Hide"
          },
          closeAfter: 10000,
          pluginNotification: n
        })
        logger.track("usage", "native-notification", n.notification)
        knownNotifications.add(n.notification.id)
      }
    })
  })
}
