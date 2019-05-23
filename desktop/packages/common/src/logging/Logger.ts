/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as _ from 'lodash'
import {isString} from "typeguard"

export type TrackType = "duration" | "usage" | "performance" | "success-rate"

export enum LogLevel {
  unknown,
  verbose,
  debug,
  info,
  warn,
  error,
  fatal
}

export type LogLevelName = keyof typeof LogLevel
export const LogLevelNames = Object.values(LogLevel).filter(isString)

export type LogTypes = LogLevelName

export type Logger = {
  [level in LogLevelName]: (...args: any[]) => void
} & {
  track(type: TrackType, event: string, data?: any | null | undefined, plugin?: string): void
  trackTimeSince(mark: string, eventName?: string | null | undefined): void
}

export type LoggerAction = keyof Logger

export type LoggerFactory = (filename: string) => Logger

//
// export interface Logger {
//
//   info: (data: any, category: string) => void;
//   warn: (data: any, category: string) => void;
//   error: (data: any, category: string) => void;
//   debug: (data: any, category: string) => void;
// }


export interface LoggerBackend {
  log(logger:Logger, category:string, level:LogLevelName, ...args:any[]): void,
  track(logger:Logger, category:string, type: TrackType, event: string, data: any | null | undefined, pluginId?: string): void,
  trackTimeSince(logger:Logger, category:string, mark: string, eventName: string | null | undefined): void
}

export const DefaultLoggerBackend:LoggerBackend = {
  log: (_logger: Logger, category: string, level: LogLevelName, ...args:any[]) => {
  if (level) {
    if (!isLoggingEnabled(category, level)) {
      return
    }
  
    const consoleRef = (console as any)[level].bind(console)
    consoleRef(`[${category}] (${level}): `, ...args)
  }
},
  track(_logger:Logger, _category:string, _type: TrackType, _event: string, _data: any | null | undefined, _pluginId?: string) {
  
  },
  trackTimeSince(_logger:Logger, _category:string, _mark: string, _eventName: string | null | undefined) {
  
  }
}

let threshold = LogLevel.info

let backend: LoggerBackend = DefaultLoggerBackend

export function getLogger(filename: string): Logger {
  const levels: Array<LogLevelName> = ["debug", "info", "warn", "error"]
  const name = _.last(filename.split("/")) as string
  return levels.reduce(
    (logger, level) => {
      logger[level] = (...args: any[]) => {
        backend.log(logger, name, level, ...args)
      }
      
      return logger
    },
    (() => {
      const logger = {} as any
      
      logger.track = (type: TrackType, event: string, data: any | null | undefined, pluginId?: string) => {
        backend.track(logger, name, type, event, data, pluginId)
      }
      
      logger.trackTimeSince = (mark: string, eventName: string | null | undefined) => {
        backend.trackTimeSince(logger, name, mark, eventName)
      }
      
      return logger
    })() as any
  )
}

export type LoggingException = [string | RegExp, LogLevel]

const loggingExceptions = Array<LoggingException>()

export function addLoggingException(matcher: string | RegExp, level: LogLevel) {
  loggingExceptions.push([matcher, level])
}

export function clearLoggingExceptions() {
  loggingExceptions.length = 0
}

export function getLoggingExceptions():Array<LoggingException> {
  return loggingExceptions
}

// noinspection JSUnusedGlobalSymbols
Object.assign(global, {
  addLoggingException,
  clearLoggingExceptions,
  getLoggingExceptions,
  LogLevel
})

export function isLoggingEnabled(cat: string, levelName: LogLevelName) {
  const level = LogLevel[levelName]
  if (level >= getLoggerThreshold()) return true
  
  return loggingExceptions
    .some(([matcher, threshold]) =>
      level >= threshold &&
      (isString(matcher) ?
        matcher === cat.replace(/(\.js|\.tsx?)/,"") :
        matcher.test(cat))
    )
}

export function setLoggerThreshold(level: LogLevel) {
  threshold = level
}

export function getLoggerThreshold(): LogLevel {
  return threshold
}

export function setLoggerBackend(loggerBackend: LoggerBackend) {
  backend = loggerBackend
}




