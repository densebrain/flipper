/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { remote } from "electron"
import {oc} from "ts-optchain"
export type ProcessConfig = {
  disabledPlugins: Set<string>,
  pluginPaths: Array<string>,
  lastWindowPosition:
    | {
        x: number,
        y: number,
        width: number,
        height: number
      }
    | null
    | undefined,
  screenCapturePath: string | null | undefined,
  launcherMsg: string | null | undefined,
  updaterEnabled: boolean,
  launcherEnabled: boolean
}

let configObj: ProcessConfig | null | undefined = null



export default function config(): ProcessConfig {
  if (configObj === null) {
    const json = JSON.parse(
      // $FlowFixMe: process.env not in type defs
      oc(remote).process.env.CONFIG(null) || process.env.CONFIG || "{}"
    )
    configObj = {
      disabledPlugins: new Set(json.disabledPlugins || []),
      pluginPaths: json.pluginPaths || [],
      lastWindowPosition: json.lastWindowPosition,
      launcherMsg: json.launcherMsg,
      updaterEnabled: typeof json.updaterEnabled === "boolean" ? json.updaterEnabled : true,
      screenCapturePath: json.screenCapturePath,
      launcherEnabled: typeof json.launcherEnabled === "boolean" ? json.launcherEnabled : true
    }
  }

  return configObj
}

export function resetConfigForTesting() {
  configObj = null
}
