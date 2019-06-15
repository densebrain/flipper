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
import * as React from "react"
import { User } from "../reducers/UserReducer"
import { ActiveSheet } from "../reducers/ApplicationReducer"
import { logout } from "../reducers/UserReducer"
import {
  setActiveSheet,
  ACTIVE_SHEET_SIGN_IN
} from "../reducers/ApplicationReducer"
import { connect } from "react-redux"
import * as Electron from "electron"
import { findDOMNode } from "react-dom"
import styled from "../ui/styled"
import FlexRow from "../ui/components/FlexRow"
import { SimpleThemeProps, withTheme } from "../ui/themes"
import Text from "../ui/components/Text"
import Glyph from "../ui/components/Glyph"
import { RootState } from "../reducers"
const Container = styled(FlexRow)(
  ({ theme: { colors } }: SimpleThemeProps) => ({
    alignItems: "center",
    padding: "5px 10px",
    borderTop: `1px solid ${colors.border}`,
    fontWeight: 500,
    flexShrink: 0,
    minHeight: 36,
    color: colors.text
  })
)
const ProfilePic = styled("img")({
  borderRadius: "999em",
  flexShrink: 0,
  width: 24,
  marginRight: 6
})
const UserName = styled(Text)({
  flexGrow: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  marginRight: 6,
  textOverflow: "ellipsis"
})

type StateProps = {
  user: User
}

type Actions = {
  logout: () => void
  setActiveSheet: (activeSheet: ActiveSheet) => void
}

type UserAccountProps = SimpleThemeProps & StateProps & Actions

const UserAccount = withTheme()(
  class UserAccount extends React.PureComponent<UserAccountProps> {
  
    private ref: HTMLElement | null | undefined
    
    private setRef = (ref: Element) => {
      const element = findDOMNode(ref)

      if (element instanceof HTMLElement) {
        this.ref = element
      }
    }
    
    private showLogin = () => this.props.setActiveSheet(ACTIVE_SHEET_SIGN_IN)
    
    private showDetails = () => {
      const menuTemplate = [
        {
          label: "Sign Out",
          click: this.props.logout
        }
      ]
      const menu = Electron.remote.Menu.buildFromTemplate(menuTemplate)
      const { bottom = 0, left = 0 } = this.ref
        ? this.ref.getBoundingClientRect()
        : ({} as ClientRect)
      menu.popup({
        window: Electron.remote.getCurrentWindow(),
        x: left,
        y: bottom + 8
      })
    }

    render() {
      const {
        theme: { colors }
      } = this.props
      return this.props.user.name ? (
        <Container innerRef={this.setRef} onClick={this.showDetails}>
          <ProfilePic src={this.props.user.profile_picture.uri} />
          <UserName>{this.props.user.name}</UserName>
          <Glyph name="chevron-down" size={10} variant="outline" />
        </Container>
      ) : (
        <Container
          onClick={this.showLogin}
        >
          <Glyph
            name="profile-circle"
            size={16}
            variant="outline"
            color={colors.text}
          />
          &nbsp;Sign In...
        </Container>
      )
    }
  }
)

export default connect<StateProps, Actions, {}, RootState>(
  ({ user }) => ({
    user
  }),
  {
    logout,
    setActiveSheet
  }
)(UserAccount)
