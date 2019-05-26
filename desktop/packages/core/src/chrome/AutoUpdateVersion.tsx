/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { getLogger } from "@states/common"
import * as React from "react"
import { remote } from "electron"
import isProduction from "../utils/isProduction"
import config from "../fb-stubs/config"
import FlexRow from "../ui/components/FlexRow"
import styled from "../ui/styled"
import LoadingIndicator from "../ui/components/LoadingIndicator"
import Glyph from "../ui/components/Glyph"
import { ThemeProps, withTheme } from "../ui/themes"

const log = getLogger(__filename)

const Container = styled(FlexRow)({
  alignItems: "center"
})

type State = {
  updater:
    | "error"
    | "checking-for-update"
    | "update-available"
    | "update-not-available"
    | "update-downloaded"
  error?: string
}

type Props = ThemeProps<
  {
    version: string
  },
  string,
  true
>

export default withTheme()(
  class AutoUpdateVersion extends React.Component<Props, State> {
    constructor(props: Props) {
      super(props)

      this.state = {
        updater: "update-not-available"
      }
    }

    componentDidMount() {
      if (isProduction()) {
        // this will fail, if the app is not code signed
        try {
          remote.autoUpdater.setFeedURL({
            url: `${config.updateServer}?version=${this.props.version}`
          })

          remote.autoUpdater.on("update-downloaded", () => {
            this.setState({
              updater: "update-downloaded"
            })
            const notification = new Notification("Update available", {
              body: "Restart States to update to the latest version.",
              requireInteraction: true
            })
            notification.onclick = remote.autoUpdater.quitAndInstall
          })
          remote.autoUpdater.on("error", error => {
            this.setState({
              updater: "error",
              error: error.toString()
            })
          })
          remote.autoUpdater.on("checking-for-update", () => {
            this.setState({
              updater: "checking-for-update"
            })
          })
          remote.autoUpdater.on("update-available", () => {
            this.setState({
              updater: "update-available"
            })
          })
          remote.autoUpdater.on("update-not-available", () => {
            this.setState({
              updater: "update-not-available"
            })
          })
          remote.autoUpdater.checkForUpdates()
        } catch (e) {
          log.error(e)
          return
        }
      }
    }

    render() {
      const {
        theme: { colors }
      } = this.props
      return (
        <Container>
          {this.state.updater === "update-available" && (
            <span title="Downloading new version">
              <LoadingIndicator size={16} />
            </span>
          )}
          {this.state.updater === "error" && (
            <span title={`Error fetching update: ${this.state.error || ""}`}>
              <Glyph color={colors.warn} name="caution-triangle" />
            </span>
          )}
          {this.state.updater === "update-downloaded" && (
            <span
              tabIndex={-1}
              role="button"
              title="Update available. Restart States."
              onClick={remote.autoUpdater.quitAndInstall}
            >
              <Glyph color={colors.warn} name="breaking-news" />
            </span>
          )}
        </Container>
      )
    }
  }
)
