/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Store } from "../reducers/index"
import { Logger } from "../fb-interfaces/Logger"
import WindowsDevice from "../devices/WindowsDevice"
export default async function (store: Store, _logger: Logger) {
  if (process.platform !== "win32") {
    return
  }

  store.dispatch({
    type: "REGISTER_DEVICE",
    payload: new WindowsDevice()
  })
}
