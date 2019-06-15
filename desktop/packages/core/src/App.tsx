/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { hot } from "react-hot-loader/root"
import * as React from "react"
import { Action as PluginAction, loadPlugins } from "./reducers/PluginReducer"
import { FlexColumn, FlexRow } from "./ui"
import { connect } from "react-redux"
import WelcomeScreen from "./chrome/WelcomeScreen"
import TitleBar from "./chrome/TitleBar"
import MainSidebar from "./chrome/MainSidebar"
import BugReporterDialog from "./chrome/BugReporterDialog"
import ErrorBar from "./chrome/ErrorBar"
import ShareSheet from "./chrome/ShareSheet"
import SignInSheet from "./chrome/SignInSheet"
import ShareSheetExportFile from "./chrome/ShareSheetExportFile"
import PluginContainer from "./PluginContainer"
import Sheet from "./chrome/Sheet"
import { ipcRenderer, remote } from "electron"
import PluginDebugger from "./chrome/PluginDebugger"
import {
  ACTIVE_SHEET_BUG_REPORTER,
  ACTIVE_SHEET_PLUGIN_DEBUGGER,
  ACTIVE_SHEET_SHARE_DATA,
  ACTIVE_SHEET_SIGN_IN,
  ACTIVE_SHEET_SHARE_DATA_IN_FILE
} from "./reducers/ApplicationReducer"
import { Logger } from "./fb-interfaces/Logger"
import BugReporter from "./fb-stubs/BugReporter"
import BaseDevice from "./devices/BaseDevice"
import { ActiveSheet } from "./reducers/ApplicationReducer"
import { Themes, ThemeContext } from "./ui/themes"

import styled from "./ui/styled"
import { RootState, Store } from "./reducers"

const version = remote.app.getVersion()
type Actions = {
  loadPlugins: () => PluginAction
}
type OwnProps = {
  logger: Logger
  bugReporter: BugReporter
  store: Store
}

type StateProps = {
  leftSidebarVisible: boolean
  selectedDevice: BaseDevice | null
  theme: string
  error: string | null
  activeSheet: ActiveSheet
  exportFile: string | null
}

type Props = OwnProps & StateProps & Actions
const RootContainer = styled(FlexColumn)(({ theme }: any) => ({
  backgroundColor: theme.colors.background
}))

export class App extends React.Component<Props> {
  componentDidMount() {
    // track time since launch
    const [s, ns] = process.hrtime()
    const launchEndTime = s * 1e3 + ns / 1e6
    ipcRenderer.on("getLaunchTime", (_: any, launchStartTime: number) => {
      this.props.logger.track(
        "performance",
        "launchTime",
        launchEndTime - launchStartTime
      )
    })
    ipcRenderer.send("getLaunchTime")
    ipcRenderer.send("componentDidMount")

    this.props.loadPlugins()
  }

  getSheet = (onHide: () => any) => {
    if (this.props.activeSheet === ACTIVE_SHEET_BUG_REPORTER) {
      return (
        <BugReporterDialog
          bugReporter={this.props.bugReporter}
          onHide={onHide}
        />
      )
    } else if (this.props.activeSheet === ACTIVE_SHEET_PLUGIN_DEBUGGER) {
      return <PluginDebugger onHide={onHide} />
    } else if (this.props.activeSheet === ACTIVE_SHEET_SHARE_DATA) {
      return <ShareSheet onHide={onHide} />
    } else if (this.props.activeSheet === ACTIVE_SHEET_SIGN_IN) {
      return <SignInSheet onHide={onHide} />
    } else if (this.props.activeSheet === ACTIVE_SHEET_SHARE_DATA_IN_FILE) {
      const { exportFile } = this.props

      if (!exportFile) {
        throw new Error("Tried to export data without passing the file path")
      }

      return <ShareSheetExportFile onHide={onHide} file={exportFile} />
    } else {
      // contents are added via React.Portal
      return null
    }
  }

  render() {
    const {
      theme,
      leftSidebarVisible,
      logger,
      store,
      selectedDevice
    } = this.props
    return (
      <ThemeContext.Provider value={Themes[theme]}>
        <RootContainer grow={true}>
          <TitleBar version={version} />
          <Sheet>{this.getSheet}</Sheet>
          <FlexRow grow={true}>
            {leftSidebarVisible && <MainSidebar />}
            {selectedDevice ? (
              <PluginContainer store={store} logger={logger} />
            ) : (
              <WelcomeScreen />
            )}
          </FlexRow>
          <ErrorBar text={this.props.error} />
        </RootContainer>
      </ThemeContext.Provider>
    )
  }
}

export default hot(
  connect<StateProps, Actions, OwnProps, RootState>(
    ({
      application: { theme, leftSidebarVisible, activeSheet, exportFile },
      connections: { selectedDevice, error }
    }) => ({
      leftSidebarVisible,
      selectedDevice,
      activeSheet,
      theme,
      exportFile,
      error
    }),
    {
      loadPlugins
    }
  )(App)
)
