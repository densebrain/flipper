import {LogLevel,DeviceLogEntry, TableBodyRow} from "@flipper/core"
import * as _ from "lodash"

export const LogLevelConfigs: { [level in LogLevel]: LogLevelConfig } = Array<
  [LogLevel] | [LogLevel, string | undefined, string | undefined]
  >(
  ["unknown"],
  ["verbose"],
  ["debug"],
  ["info", "Info", "info-circle"],
  ["warn", "Warn", "caution-triangle"],
  ["error", "Error", "caution-octagon"],
  ["fatal", "Fatal", "stop"]
)
  .map(([level, label, icon]) => makeLogLevelConfig(level, label, icon))
  .reduce(
    (map, config) => {
      map[config.level] = config
      return map
    },
    {} as { [level in LogLevel]: LogLevelConfig }
  )

export const
  MaxPageCount = 100,
  PageSize = 50

export type LogRecord = {
  row: TableBodyRow
  entry: DeviceLogEntry
}

export type LogRecords = Array<LogRecord>

export type LogPluginClasses =
  | "logRowUnknown"
  | "logRowVerbose"
  | "logRowDebug"
  | "logRowInfo"
  | "logRowWarn"
  | "logRowError"
  | "logRowFatal"

export type LogLevelConfig = {
  icon?: string | null | undefined
  label: string
  level: LogLevel
  classNameAlias: LogPluginClasses
}



function makeLogLevelConfig(
  level: LogLevel,
  label: string | undefined = _.capitalize(level),
  icon?: string | null | undefined
): LogLevelConfig {
  return {
    level,
    label,
    icon,
    classNameAlias: `logRow${_.capitalize(level)}` as any
  }
}



export const COLUMNS = {
  type: {
    value: ""
  },
  time: {
    value: "Time"
  },
  pid: {
    value: "PID"
  },
  tid: {
    value: "TID"
  },
  tag: {
    value: "Tag"
  },
  app: {
    value: "App"
  },
  message: {
    value: "Message"
  }
}
export const INITIAL_COLUMN_ORDER = [
  {
    key: "type",
    visible: true
  },
  {
    key: "time",
    visible: false
  },
  {
    key: "pid",
    visible: false
  },
  {
    key: "tid",
    visible: false
  },
  {
    key: "tag",
    visible: true
  },
  {
    key: "app",
    visible: true
  },
  {
    key: "message",
    visible: true
  }
]
