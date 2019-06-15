/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import androidDevice from "./AndroidDeviceDispatcher"
import iOSDevice from "./iOSDeviceDispatcher"
import windowsDevice from "./WindowsDeviceDispatcher"
import application from "./ApplicationDispatcher"
import tracking from "./TrackingDispatcher"
import server from "./ServerDispatcher"
import notifications from "./NotificationsDispatcher"
import plugins from "./PluginDispatcher"
import user from "./UserDispatcher"

import { Logger } from "../fb-interfaces/Logger"
import { Store } from "../reducers/index"

export default async function (store: Store, logger: Logger) {
  for (const fn of [
    application,
    androidDevice,
    iOSDevice,
    windowsDevice,
    tracking,
    server,
    notifications,
    plugins,
    user
  ]) {
    await fn(store, logger)
  }
}
