/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 * @flow
 */
import {
  FlipperDevicePluginComponent,
  Device,
  View,
  styled,
  FlexColumn,
  FlexRow,
  ContextMenu,
  clipboard,
  Button,
  getPluginKey,
  getPersistedState,
  BaseDevice,
  shouldParseAndroidLog,
  StackTrace,
  Text,
  colors,
  Toolbar,
  Spacer,
  Select,
  styleCreator,
  Store,
  DeviceLogEntry,
  OS,
  Notification,
  Plugin,
  FlipperPluginProps, PluginType, PluginExport
} from "@flipper/core"

//import unicodeSubstring from "unicode-substring"
import * as Fs from "fs"
import * as Os from "os"
import * as Util from "util"
import * as Path from "path"

import * as React from "react"
import {Component, CSSProperties} from "react"
import {oc} from "ts-optchain"


const unicodeSubstring = require("unicode-substring").default

type HeaderRowProps = {
  title: string,
  value: string
}
type openLogsCallbackType = () => void
type CrashReporterBarProps = {
  openLogsCallback?: openLogsCallbackType,
  crashSelector: CrashSelectorProps
}
type CrashSelectorProps = {
  crashes:
    | {
        [key: string]: string
      }
    | null
    | undefined,
  orderedIDs: Array<string> | null | undefined,
  selectedCrashID: string | null | undefined,
  onCrashChange: (a: string) => void | null | undefined
}
export type Crash = {
  notificationID: string,
  callstack: string,
  reason: string,
  name: string,
  date: Date
}
export type CrashLog = {
  callstack: string,
  reason: string,
  name: string,
  date: Date | null | undefined
}
export type CrashReporterPersistedState = {
  crashes: Array<Crash>
}
type CrashReporterState = {
  crash: Crash | null | undefined
}
export type PadderProps = Pick<CSSProperties, "paddingLeft" | "paddingRight" | "paddingTop" | "paddingBottom">
const Padder = styled("div")(
  styleCreator(
    ({ paddingLeft, paddingRight, paddingBottom, paddingTop }:PadderProps) => ({
      paddingLeft: paddingLeft || 0,
      paddingRight: paddingRight || 0,
      paddingBottom: paddingBottom || 0,
      paddingTop: paddingTop || 0
    }),
    ["paddingTop", "paddingLeft", "paddingRight", "paddingBottom"]
  )
)
const Title = styled(Text)({
  fontWeight: "bold",
  color: colors.greyTint3,
  height: "auto",
  width: 200,
  textOverflow: "ellipsis"
})
const Line = styled(View)({
  backgroundColor: colors.greyTint2,
  height: 1,
  width: "auto",
  marginTop: 2,
  flexShrink: 0
})
const Container = styled(FlexColumn)({
  overflow: "hidden",
  flexShrink: 0
})
const Value = styled(Text)({
  fontWeight: "bold",
  color: colors.greyTint3,
  height: "auto",
  maxHeight: 200,
  flexGrow: 1,
  textOverflow: "ellipsis",
  marginRight: 8
})
const FlexGrowColumn = styled(FlexColumn)({
  flexGrow: 1
})
const ScrollableColumn = styled(FlexGrowColumn)({
  overflow: "scroll",
  height: "auto"
})
const StyledFlexGrowColumn = styled(FlexColumn)({
  flexGrow: 1
})
const StyledFlexRowColumn = styled(FlexRow)({
  aligItems: "center",
  justifyContent: "center",
  height: "100%"
})
const StyledFlexColumn = styled(StyledFlexGrowColumn)({
  justifyContent: "center",
  alignItems: "center"
})
const MatchParentHeightComponent = styled(FlexRow)({
  height: "100%"
})
const ButtonGroupContainer = styled(FlexRow)({
  paddingLeft: 4,
  paddingTop: 2,
  paddingBottom: 2,
  height: "100%"
})
const StyledSelectContainer = styled(FlexRow)({
  paddingLeft: 8,
  paddingTop: 2,
  paddingBottom: 2,
  height: "100%"
})
const StyledSelect = styled(Select)({
  height: "100%",
  maxWidth: 200
})
export function getNewPersistedStateFromCrashLog(
  persistedState: CrashReporterPersistedState | null | undefined,
  persistingPlugin: typeof CrashReporterPlugin,
  content: string,
  os?: OS | null | undefined,
  logDate?: Date | null | undefined
): Partial<CrashReporterPersistedState> | null | undefined {
  const persistedStateReducer = (persistingPlugin.componentClazz as typeof CrashReporterComponent).persistedStateReducer

  if (!os || !persistedStateReducer) {
    return null
  }

  const crash = parseCrashLog(content, os, logDate)
  return persistedStateReducer(persistedState, "crash-report", crash)
}
export function parseCrashLogAndUpdateState(
  store: Store,
  content: string,
  setPersistedState: (pluginKey: string, newPluginState: Partial<CrashReporterPersistedState> | null | undefined) => void,
  logDate?: Date | null | undefined
) {
  const state = store.getState(),
    {connections} = state,
    os = oc(connections).selectedDevice.os(null)

  if (!os || !shouldShowCrashNotification(connections.selectedDevice, content, os)) {
    return
  }

  const pluginID = CrashReporterComponent.id
  const pluginKey = getPluginKey(null, store.getState().connections.selectedDevice, pluginID)
  const persistingPlugin:
    | Plugin
    | null
    | undefined = store.getState().plugins.devicePlugins.get(CrashReporterComponent.id)

  if (!persistingPlugin) {
    return
  }

  const pluginStates = store.getState().pluginStates
  const persistedState = getPersistedState(pluginKey, persistingPlugin, pluginStates)
  const newPluginState = getNewPersistedStateFromCrashLog(persistedState, persistingPlugin as any, content, os, logDate)
  setPersistedState(pluginKey, newPluginState)
}
export function shouldShowCrashNotification(
  baseDevice: BaseDevice | null | undefined,
  content: string,
  os?: OS | null | undefined
): boolean {
  if (os && os === "Android") {
    return true
  }

  const appPath = parsePath(content)
  const serial: string = oc(baseDevice).serial("unknown")
  
  // Do not show notifications for the app which are not the selected one
  return appPath && appPath.includes(serial)
}
export function parseCrashLog(content: string, os: OS, logDate?: Date | null | undefined): CrashLog {
  const stubString = "Cannot figure out the cause"

  switch (os) {
    case "iOS": {
      const regex = /Exception Type: *[\w]*/
      const arr = regex.exec(content)
      const exceptionString = arr ? arr[0] : ""
      const exceptionRegex = /[\w]*$/
      const tmp = exceptionRegex.exec(exceptionString)
      const exception = tmp && tmp[0].length ? tmp[0] : "Cannot figure out the cause"
      let date = logDate

      if (!date) {
        const dateRegex = /Date\/Time: *[\w\s\.:-]*/
        const dateArr = dateRegex.exec(content)
        const dateString = dateArr ? dateArr[0] : ""
        const dateRegex2 = /[\w\s\.:-]*$/
        const tmp1 = dateRegex2.exec(dateString)
        const extractedDateString: string | null | undefined = tmp1 && tmp1[0].length ? tmp1[0] : null
        date = extractedDateString ? new Date(extractedDateString) : logDate
      }

      const crash = {
        callstack: content,
        name: exception,
        reason: exception,
        date
      }
      return crash
    }

    case "Android": {
      const regForName = /.*\n/
      const nameRegArr = regForName.exec(content)
      let name = nameRegArr ? nameRegArr[0] : stubString
      const regForCallStack = /\tat[\w\s\n.$&+,:;=?@#|'<>.^*()%!-]*$/
      const callStackArray = regForCallStack.exec(content)
      const callStack = callStackArray ? callStackArray[0] : ""
      let remainingString = callStack.length > 0 ? content.replace(callStack, "") : ""

      if (remainingString[remainingString.length - 1] === "\n") {
        remainingString = remainingString.slice(0, -1)
      }

      const reason = remainingString.length > 0 ? remainingString.split("\n").pop() : stubString

      if (name[name.length - 1] === "\n") {
        name = name.slice(0, -1)
      }

      const crash = {
        callstack: content,
        name: name,
        reason: reason,
        date: logDate
      }
      return crash
    }

    default: {
      throw new Error("Unsupported OS")
    }
  }
}

function truncate(baseString: string, numOfChars: number): string {
  if (baseString.length <= numOfChars) {
    return baseString
  }

  const truncated_string = unicodeSubstring(baseString, 0, numOfChars - 1)
  return truncated_string + "\u2026"
}

export function parsePath(content: string): string | null | undefined {
  const regex = /Path: *[\w\-\/\.\t\ \_\%]*\n/
  const arr = regex.exec(content)

  if (!arr || arr.length <= 0) {
    return null
  }

  const pathString = arr[0]
  const pathRegex = /[\w\-\/\.\t\ \_\%]*\n/
  const tmp = pathRegex.exec(pathString)

  if (!tmp || tmp.length == 0) {
    return null
  }

  const path = tmp[0]
  return path.trim()
}

function addFileWatcherForiOSCrashLogs(
  store: Store,
  setPersistedState: (pluginKey: string, newPluginState: CrashReporterPersistedState | null | undefined) => void
) {
  const dir = Path.join(Os.homedir(), "Library", "Logs", "DiagnosticReports")

  if (!Fs.existsSync(dir)) {
    // Directory doesn't exist
    return
  }

  Fs.watch(dir, (_eventType, filename) => {
    // We just parse the crash logs with extension `.crash`
    const checkFileExtension = /.crash$/.exec(filename)

    if (!filename || !checkFileExtension) {
      return
    }

    Fs.readFile(Path.join(dir, filename), "utf8", function(err, data) {
      if (oc(store.getState()).connections.selectedDevice.os(null) !== "iOS") {
        // If the selected device is not iOS don't show crash notifications
        return
      }

      if (err) {
        console.error(err)
        return
      }

      parseCrashLogAndUpdateState(store, Util.format(data), setPersistedState)
    })
  })
}

class CrashSelector extends Component<CrashSelectorProps> {
  
  render() {
    const { crashes, selectedCrashID, orderedIDs, onCrashChange } = this.props
    return (
      <StyledFlexRowColumn>
        <ButtonGroupContainer>
          <MatchParentHeightComponent>
            <Button
              disabled={Boolean(!orderedIDs || orderedIDs.length <= 1)}
              compact={true}
              onClick={() => {
                if (onCrashChange && orderedIDs) {
                  const index = orderedIDs.indexOf(selectedCrashID)
                  const nextIndex = index < 1 ? orderedIDs.length - 1 : index - 1
                  const nextID = orderedIDs[nextIndex]
                  onCrashChange(nextID)
                }
              }}
              icon="chevron-left"
              iconSize={12}
              title="Previous Crash"
            />
          </MatchParentHeightComponent>
          <MatchParentHeightComponent>
            <Button
              disabled={Boolean(!orderedIDs || orderedIDs.length <= 1)}
              compact={true}
              onClick={() => {
                if (onCrashChange && orderedIDs) {
                  const index = orderedIDs.indexOf(selectedCrashID)
                  const nextIndex = index >= orderedIDs.length - 1 ? 0 : index + 1
                  const nextID = orderedIDs[nextIndex]
                  onCrashChange(nextID)
                }
              }}
              icon="chevron-right"
              iconSize={12}
              title="Next Crash"
            />
          </MatchParentHeightComponent>
        </ButtonGroupContainer>
        <StyledSelectContainer>
          <StyledSelect
            grow={true}
            selected={selectedCrashID || "NoCrashID"}
            options={
              crashes || {
                NoCrashID: "No Crash"
              }
            }
            onChange={(title: string) => {
              for (const key in crashes) {
                if (crashes[key] === title && onCrashChange) {
                  onCrashChange(key)
                  return
                }
              }
            }}
          />
        </StyledSelectContainer>
      </StyledFlexRowColumn>
    )
  }
}

class CrashReporterBar extends Component<CrashReporterBarProps> {
  render() {
    const { openLogsCallback, crashSelector } = this.props
    return (
      <Toolbar>
        <CrashSelector {...crashSelector} />
        <Spacer />
        <Button disabled={Boolean(!openLogsCallback)} onClick={openLogsCallback}>
          Open In Logs
        </Button>
      </Toolbar>
    )
  }
}

class HeaderRow extends Component<HeaderRowProps> {
  render() {
    const { title, value } = this.props
    return (
      <Padder paddingTop={8} paddingBottom={2}>
        <Container>
          <Padder paddingLeft={8}>
            <FlexRow>
              <Title>{title}</Title>
              <ContextMenu
                items={[
                  {
                    label: "copy",
                    click: () => {
                      clipboard.writeText(value)
                    }
                  }
                ]}
              >
                <Value code={true}>{value}</Value>
              </ContextMenu>
            </FlexRow>
          </Padder>
          <Line />
        </Container>
      </Padder>
    )
  }
}



type ActionType = "crash-report" | "flipper-crash-report"

// interface CrashReporterActions extends PluginActions<ActionType> {
//   "crash-report": { type: "crash-report"} & CrashLog
//   "flipper-crash-report": { type: "flipper-crash-report"} & CrashLog
// }

type ActionPayload<Type extends ActionType> =
  Type extends "crash-report" ? CrashLog : Type extends "flipper-crash-report" ? CrashLog : never

type CrashReporterActions = {[type in ActionType]: ActionPayload<type>}

class CrashReporterComponent extends FlipperDevicePluginComponent<FlipperPluginProps<CrashReporterPersistedState>,CrashReporterState, CrashReporterActions, CrashReporterPersistedState> {
  static id = "CrashReporter"
  
  static defaultPersistedState = {
    crashes: []
  } as CrashReporterPersistedState

  static supportsDevice(device: Device) {
    return device.os === "iOS" || device.os === "Android"
  }

  static notificationID: number = 0
  /*
   * Reducer to process incoming "send" messages from the mobile counterpart.
   */

  static persistedStateReducer = (
    persistedState: CrashReporterPersistedState,
    method: ActionType,
    payload: CrashReporterActions[typeof method]
  ):Partial<CrashReporterPersistedState> => {
    if (method === "crash-report" || method === "flipper-crash-report") {
      CrashReporterComponent.notificationID++
      const
        {callstack, name, reason, date} = payload,
        mergedState: CrashReporterPersistedState = {
        crashes: persistedState.crashes.concat([
          {
            notificationID: CrashReporterComponent.notificationID.toString(),
            // All notifications are unique
            callstack,
            name,
            reason,
            date: date || new Date()
          }
        ])
      }
      return mergedState
    }

    return persistedState
  }
  static trimCallStackIfPossible = (callstack: string): string => {
    let regex = /Application Specific Information:/
    const query = regex.exec(callstack)
    return query ? callstack.substring(0, query.index) : callstack
  }
  /*
   * Callback to provide the currently active notifications.
   */

  static getActiveNotifications = (persistedState: CrashReporterPersistedState): Array<Notification> => {
    return persistedState.crashes.map((crash: Crash) => {
      const id = crash.notificationID
      const title = `CRASH: ${truncate(crash.name, 50)} Reason: ${truncate(crash.reason, 50)}`
      const callstack = CrashReporterComponent.trimCallStackIfPossible(crash.callstack)
      const msg = `Callstack: ${truncate(callstack, 200)}`
      return {
        id,
        message: msg,
        severity: "error",
        title: title,
        action: id
      }
    })
  }
  /*
   * This function gets called whenever the device is registered
   */

  static onRegisterDevice = (
    store: Store,
    baseDevice: BaseDevice,
    setPersistedState: (pluginKey: string, newPluginState: CrashReporterPersistedState | null | undefined) => void
  ) => {
    if (baseDevice.os.includes("iOS")) {
      addFileWatcherForiOSCrashLogs(store, setPersistedState)
    } else {
      const referenceDate = new Date()

      ;(function(
        store: Store,
        _date: Date,
        setPersistedState: (pluginKey: string, newPluginState: CrashReporterPersistedState | null | undefined) => void
      ) {
        let androidLog: string = ""
        let androidLogUnderProcess = false
        let timer: NodeJS.Timeout = null
        baseDevice.addLogListener((entry: DeviceLogEntry) => {
          if (shouldParseAndroidLog(entry, referenceDate)) {
            if (androidLogUnderProcess) {
              androidLog += "\n" + entry.message
              androidLog = androidLog.trim()

              if (timer) {
                clearTimeout(timer)
              }
            } else {
              androidLog = entry.message
              androidLogUnderProcess = true
            }

            timer = setTimeout(() => {
              if (androidLog.length > 0) {
                parseCrashLogAndUpdateState(store, androidLog, setPersistedState, entry.date)
              }

              androidLogUnderProcess = false
              androidLog = ""
            }, 50)
          }
        })
      })(store, referenceDate, setPersistedState)
    }
  }
  openInLogs = (callstack: string) => {
    this.props.selectPlugin("DeviceLogs", callstack)
  }

  constructor(props: FlipperPluginProps<CrashReporterPersistedState>) {
    // Required step: always call the parent class' constructor
    super(props)
    
    let crash: Crash | null | undefined = null
    const {persistedState, deepLinkPayload} = props,
      {crashes} = persistedState
    if (crashes && crashes.length > 0) {
      crash = crashes[crashes.length - 1]
    }

    let deeplinkedCrash : Crash | null = null

    if (deepLinkPayload) {
      const id = this.props.deepLinkPayload
      const index = crashes.findIndex(elem => {
        return elem.notificationID === id
      })

      if (index >= 0) {
        deeplinkedCrash = this.props.persistedState.crashes[index]
      }
    } // Set the state directly. Use props if necessary.

    this.state = {
      crash: deeplinkedCrash || crash
    }
  }

  render() {
    const
      {persistedState} = this.props,
      {crashes} = persistedState
    
    let {crash: crashToBeInspected} = this.state
    
    if (!crashToBeInspected && crashes.length > 0) {
      crashToBeInspected = crashes[crashes.length - 1]
    }

    const crash = crashToBeInspected

    if (crash) {
      const crashMap = crashes.reduce((acc: { [key: string]: string }, persistedCrash: Crash) => {
        const { notificationID, date } = persistedCrash
        const name = "Crash at " + date.toLocaleString()
        acc[notificationID] = name
        return acc
      }, {})
      const orderedIDs = crashes.map(persistedCrash => persistedCrash.notificationID)
      const selectedCrashID = crash.notificationID

      const onCrashChange = (id:string)                                                                                                                     => {
        const newSelectedCrash = crashes.find(element => {
          return element.notificationID === id
        })
        this.setState({
          crash: newSelectedCrash
        })
        console.log("onCrashChange called", id)
      }

      const callstackString = crash.callstack
      const children = crash.callstack.split("\n").map(str => {
        return {
          message: str
        }
      })
      const crashSelector: CrashSelectorProps = {
        crashes: crashMap,
        orderedIDs,
        selectedCrashID,
        onCrashChange
      }
      return (
        <FlexColumn>
          {this.device.os == "Android" ? (
            <CrashReporterBar
              crashSelector={crashSelector}
              openLogsCallback={() => {
                this.openInLogs(crash.callstack)
              }}
            />
          ) : (
            <CrashReporterBar crashSelector={crashSelector} />
          )}
          <ScrollableColumn>
            <HeaderRow title="Name" value={crash.name} />
            <HeaderRow title="Reason" value={crash.reason} />
            <Padder paddingLeft={8} paddingTop={4} paddingBottom={2}>
              <Title> Stacktrace </Title>
            </Padder>
            <ContextMenu
              items={[
                {
                  label: "copy",
                  click: () => {
                    clipboard.writeText(callstackString)
                  }
                }
              ]}
            >
              <Line />
              <StackTrace
                children={children}
                isCrash={false}
                padded={false}
                backgroundColor={colors.greyStackTraceTint}
              />
            </ContextMenu>
          </ScrollableColumn>
        </FlexColumn>
      )
    }

    const crashSelector = {
      crashes: null,
      orderedIDs: null,
      selectedCrashID: null,
      onCrashChange: null
    } as CrashSelectorProps
    
    return (
      <StyledFlexGrowColumn>
        <CrashReporterBar crashSelector={crashSelector} />
        <StyledFlexColumn>
          <Padder paddingBottom={8}>
            <Title>No Crashes Logged</Title>
          </Padder>
        </StyledFlexColumn>
      </StyledFlexGrowColumn>
    )
  }
}

const CrashReporterPlugin = {
  id: CrashReporterComponent.id,
  type: PluginType.Device,
  componentClazz: CrashReporterComponent
} as PluginExport<typeof CrashReporterComponent, any, any, any, any, PluginType.Device>

export default CrashReporterPlugin
