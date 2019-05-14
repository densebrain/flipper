/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { TrackType, Logger } from "../fb-interfaces/Logger"
import { Store } from "../reducers/index"
import ScribeLogger from "./ScribeLogger"
var instance: StubLogger | null | undefined = null
type Args = {
  isHeadless?: boolean
}

class StubLogger implements Logger {
  
  // @ts-ignore
  constructor(store: Store, args?: Args) {
    this.scribeLogger = new ScribeLogger(this)
  }

  scribeLogger: ScribeLogger
  
  // @ts-ignore
  track(type: TrackType, event: string, data: any | null | undefined, plugin?: string) {}
  
  // @ts-ignore
  trackTimeSince(mark: string, eventName: string | null | undefined) {}
  
  // @ts-ignore
  info(data: any, category: string) {}
  
  // @ts-ignore
  warn(data: any, category: string) {}
  
  // @ts-ignore
  error(data: any, category: string) {}
  
  // @ts-ignore
  debug(data: any, category: string) {}
}
// @ts-ignore
export function init(store: Store, args?: Args): Logger {
  if (instance) {
    throw new Error("Attempted to initialize Logger when already initialized")
  }

  instance = new StubLogger(store)
  return instance
}
export function getInstance(): Logger {
  if (!instance) {
    throw new Error("Requested Logger instance without initializing it. Make sure init() is called at app start")
  }

  return instance
}
