/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { LauncherMsg } from "../reducers/application"
import styled from "../ui/styled"
import FlexRow from "../ui/components/FlexRow"
import {SimpleThemeProps, Theme, withTheme} from "../ui/themes"
import Glyph from "../ui/components/Glyph"

const Container = styled(FlexRow)({
  alignItems: "center",
  marginLeft: 4
})
type Props = SimpleThemeProps & {
  launcherMsg: LauncherMsg
}

function getSeverityColor({colors}: Theme, severity: "warning" | "error"): string {
  switch (severity) {
    case "warning":
      return colors.warn

    case "error":
      return colors.error
  } // Flow isn't smart enough to see that the above is already exhaustive.

  return ""
}

export default withTheme()(class UpdateIndicator extends React.Component<Props, undefined> {
  render() {
    const {theme} = this.props
    if (this.props.launcherMsg.message.length == 0) {
      return null
    }

    return (
      <Container>
        <span title={this.props.launcherMsg.message}>
          <Glyph color={getSeverityColor(theme,this.props.launcherMsg.severity)} name="caution-triangle" />
        </span>
      </Container>
    )
  }
})
