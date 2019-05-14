/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {DeviceType, DeviceShell, LogLevel} from "./BaseDevice"
import * as Logcat from "adbkit-logcat-fb"
import child_process from "child_process"
import BaseDevice from "./BaseDevice"

const child_process_promise  = require("child-process-es6-promise")

type ADBClient = any
//type Priority = Logcat.Priority

export default class AndroidDevice extends BaseDevice {
  constructor(serial: string, deviceType: DeviceType, title: string, adb: ADBClient) {
    super("Android", serial, deviceType, title)
    this.adb = adb
    this.adb.openLogcat(this.serial).then((reader: any) => {
      reader.on("entry", (entry: any) => {
        let type:LogLevel = "unknown"

        if (entry.priority === Logcat.Priority.VERBOSE) {
          type = "verbose"
        }

        if (entry.priority === Logcat.Priority.DEBUG) {
          type = "debug"
        }

        if (entry.priority === Logcat.Priority.INFO) {
          type = "info"
        }

        if (entry.priority === Logcat.Priority.WARN) {
          type = "warn"
        }

        if (entry.priority === Logcat.Priority.ERROR) {
          type = "error"
        }

        if (entry.priority === Logcat.Priority.FATAL) {
          type = "fatal"
        }

        this.addLogEntry({
          tag: entry.tag,
          pid: entry.pid,
          tid: entry.tid,
          message: entry.message,
          date: entry.date,
          type
        })
      })
    })
  }

  icon = "icons/android.svg"
  
  adb: ADBClient
  pidAppMapping: {
    [key: number]: string
  } = {}
  logReader: any

  supportedColumns(): Array<string> {
    return ["date", "pid", "tid", "tag", "message", "type", "time"]
  }

  reverse(ports: [number, number]): Promise<void> {
    return Promise.all(ports.map(port => this.adb.reverse(this.serial, `tcp:${port}`, `tcp:${port}`))).then(() => {
      return
    })
  }

  spawnShell(): DeviceShell | null | undefined {
    return child_process.spawn("adb", ["-s", this.serial, "shell", "-t", "-t"])
  }

  clearLogs(): Promise<void> {
    return child_process_promise.spawn("adb", ["logcat", "-c"])
  }
}
