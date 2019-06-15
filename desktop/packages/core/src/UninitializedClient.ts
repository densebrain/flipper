/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { stato } from "@stato/models"


export interface UninitializedClient {
  metadata: stato.SDKState
  // os: string
  // deviceName: string,
  // appName: string
  errorMessage?: string | null | undefined
  deviceId?: string | null | undefined
}
