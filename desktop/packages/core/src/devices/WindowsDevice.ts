/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import BaseDevice from "./BaseDevice"
import {stato as Models} from "@stato/models"

export default class WindowsDevice extends BaseDevice {
  

  constructor() {
    super(Models.OS.OSWindows,"", "physical", "desktop")
  }

  teardown() {}

  supportedColumns(): Array<string> {
    return []
  }
}
