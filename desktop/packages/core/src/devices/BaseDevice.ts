/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import stream from "stream"
export type LogLevel = "unknown" | "verbose" | "debug" | "info" | "warn" | "error" | "fatal"
export type DeviceLogEntry = {
  date: Date,
  pid: number,
  tid: number,
  app?: string,
  type: LogLevel,
  tag: string,
  message: string
}
export type DeviceShell = {
  stdout: stream.Readable,
  stderr: stream.Readable,
  stdin: stream.Writable
}
export type DeviceLogListener = (entry: DeviceLogEntry) => void
export type DeviceType = "emulator" | "physical" | "archivedEmulator" | "archivedPhysical"
export type DeviceExport = {
  os: Models.OS,
  title: string,
  deviceType: DeviceType,
  serial: string,
  logs: Array<DeviceLogEntry>
}

import {stato as Models} from "@stato/models"

//export type OS = Models.OS //"iOS" | "Android" | "Windows" | never
export default class BaseDevice {
  constructor(os: Models.OS, serial: string, deviceType: DeviceType, title: string) {
    this.os = os
    this.serial = serial
    this.title = title
    this.deviceType = deviceType
  } // operating system of this device

  os: Models.OS // human readable name for this device

  title: string // type of this device

  deviceType: DeviceType // serial number for this device

  serial: string // possible src of icon to display next to the device title

  icon: string | null | undefined
  logListeners: Map<Symbol, DeviceLogListener> = new Map()
  logEntries: Array<DeviceLogEntry> = []

  supportsOS(os: Models.OS) {
    return os === this.os
  }

  toJSON(): DeviceExport {
    return {
      os: this.os,
      title: this.title,
      deviceType: this.deviceType,
      serial: this.serial,
      logs: this.getLogs()
    }
  }

  teardown() {}

  supportedColumns(): Array<string> {
    return ["date", "pid", "tid", "tag", "message", "type", "time"]
  }

  addLogListener(callback: DeviceLogListener): Symbol {
    const id = Symbol()
    this.logListeners.set(id, callback)
    return id
  }

  _notifyLogListeners(entry: DeviceLogEntry) {
    if (this.logListeners.size > 0) {
      this.logListeners.forEach(listener => {
        // prevent breaking other listeners, if one listener doesn't work.
        try {
          listener(entry)
        } catch (e) {
          console.error(`Log listener exception:`, e)
        }
      })
    }
  }

  addLogEntry(entry: DeviceLogEntry) {
    this.logEntries.push(entry)

    this._notifyLogListeners(entry)
  }

  getLogs(): Array<DeviceLogEntry> {
    return this.logEntries
  }

  clearLogs(): Promise<void> {
    // Only for device types that allow clearing.
    return Promise.resolve()
  }

  removeLogListener(id: Symbol) {
    this.logListeners.delete(id)
  }

  spawnShell(): DeviceShell | null | undefined {
    throw new Error("unimplemented")
  }
}
