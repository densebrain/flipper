/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import "./Args"

import * as Path from "path"

import * as Fs from "fs"
import {FlipperConfig, flipperDir} from "@flipper/common"



export default function(argv: Partial<FlipperOptions>) {
  
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
