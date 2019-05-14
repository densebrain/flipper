/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import "./Args"

import * as Path from "path"

import * as Os from "os"

import * as Fs from "fs"

type FlipperConfig = {
  pluginPaths: Array<string>
  disabledPlugins: Array<string>
  lastWindowPosition?: any
  updaterEnabled?: boolean | undefined
  launcherMsg?: string | undefined
}

export default function(argv: Partial<FlipperOptions>) {
  if (!process.env.ANDROID_HOME) {
    process.env.ANDROID_HOME = "/opt/android_sdk"
  } // emulator/emulator is more reliable than tools/emulator, so prefer it if
  // it exists

  process.env.PATH = `${process.env.ANDROID_HOME}/emulator:${process.env.ANDROID_HOME}/tools:${process.env.PATH}` // ensure .flipper folder and config exist

  const flipperDir = Path.join(Os.homedir(), ".flipper")

  if (!Fs.existsSync(flipperDir)) {
    Fs.mkdirSync(flipperDir)
  }

  const configPath = Path.join(flipperDir, "config.json")
  let config: FlipperConfig = {
    pluginPaths: [],
    disabledPlugins: [],
    lastWindowPosition: {}
  }

  try {
    config = { ...config, ...JSON.parse(Fs.readFileSync(configPath,'utf-8')) }
  } catch (e) {
    // file not readable or not parsable, overwrite it with the new config
    Fs.writeFileSync(configPath, JSON.stringify(config))
  } // Non-persistent CLI arguments.

  config = { ...config, updaterEnabled: !!argv.updater, launcherMsg: argv["launcher-msg"] }
  return {
    config,
    configPath,
    flipperDir
  }
}
