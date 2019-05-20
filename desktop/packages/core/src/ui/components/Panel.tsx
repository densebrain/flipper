/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import React from "react"
import styled, {styleCreator} from "../styled/index"
import FlexColumn from "./FlexColumn"
import FlexBox from "./FlexBox" //import {colors} from '../themes/colors';
import Glyph from "./Glyph"
import {withStyles,Theme} from "../themes"
import {rem} from "../styled"

import Text from "./Text"
import {ThemeProps} from "../themes"

function panelBorder(theme: Theme): string {
  const colors = theme.colors
  return `${rem(0.1)} solid ${colors.border}`
}

const Chevron = styled(Glyph)({
  marginRight: 4,
  marginLeft: -2,
  marginBottom: 1
})
export type PanelClasses = "root"

export type PanelProps = ThemeProps<{
  className?: string,
  floating?: boolean,
  theme?: Theme,
  grow?: boolean,
  heading: React.ReactNode,
  children?: React.ReactNode,
  padded?: boolean,
  collapsable: boolean,
  collapsed?: boolean,
  accessory?: React.ReactNode
},PanelClasses,true>

function baseStyles(_theme: Theme) {
  return {
    root: {}
  }
}
/**
 * A Panel component.
 */

export default
withStyles(baseStyles, {
  withTheme: true
})(
class Panel extends React.Component<
  PanelProps,
  {
    collapsed: boolean
  }
> {
  static defaultProps: {
    floating: boolean,
    grow: boolean,
    collapsable: boolean,
    collapsed: boolean
  } = {
    grow: false,
    floating: true,
    collapsable: true,
    collapsed: false
  }
  static PanelContainer = styled(FlexColumn, "PanelContainer")(
    styleCreator(
      ({ theme, floating, collapsed }) => ({
        ...theme.panel.container,
        flexShrink: 0,
        padding: floating ? 10 : 0,
        borderBottom: collapsed ? "none" : panelBorder(theme)
      }),
      ["floating", "padded", "collapsed"]
    )
  )
  static PanelHeader = styled(FlexBox, "PanelHeader")(
    styleCreator(
      ({ theme, floating, padded }) => ({
        ...theme.panel.header,
        backgroundColor: theme.colors.background,
        border: floating ? panelBorder(theme) : "none",
        borderBottom: panelBorder(theme),
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        justifyContent: "space-between",
        lineHeight: "27px",
        fontWeight: 500,
        flexShrink: 0,
        padding: padded ? "0 10px" : 0,
        "&:not(:first-child)": {
          borderTop: panelBorder(theme)
        }
      }),
      ["floating", "padded", "collapsed"]
    )
  )
  static PanelBody = styled(FlexColumn, "PanelBody")(
    styleCreator(
      ({ theme, floating, padded }) => ({
        ...theme.panel.body,
        backgroundColor: theme.colors.backgroundStatus,
        border: floating ? panelBorder(theme) : "none",
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderTop: "none",
        flexGrow: 1,
        padding: padded ? 10 : 0,
        overflow: "visible"
      }),
      ["floating", "padded", "collapsed"]
    )
  )
  state = {
    collapsed: this.props.collapsed == null ? false : this.props.collapsed
  }
  onClick = () =>
    this.setState({
      collapsed: !this.state.collapsed
    })

  render() {
    const {
        padded,
        children,
        className,
        grow,
        floating,
        heading,
        collapsable,
        theme: { colors },
        accessory
      } = this.props,
      { collapsed } = this.state
    return (
      <Panel.PanelContainer className={className} floating={floating} grow={grow} collapsed={collapsed}>
        <Panel.PanelHeader floating={floating} padded={typeof heading === "string"} onClick={this.onClick}>
          <Text>
            {collapsable && (
              <Chevron color={colors.text} name={collapsed ? "triangle-right" : "triangle-down"} size={12} />
            )}
            {heading}
          </Text>
          {accessory}
        </Panel.PanelHeader>

        {children == null || (collapsable && collapsed) ? null : (
          <Panel.PanelBody scrollable grow={grow} padded={padded == null ? true : padded} floating={floating}>
            {children}
          </Panel.PanelBody>
        )}
      </Panel.PanelContainer>
    )
  }
})
