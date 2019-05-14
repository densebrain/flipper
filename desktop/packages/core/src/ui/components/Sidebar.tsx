/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import Interactive, {InteractiveProps} from "./Interactive"
import FlexColumn from "./FlexColumn"
import {Component} from "react"
import {makeRootView} from "./RootView"

const SidebarInteractiveContainer = makeRootView<InteractiveProps>(
  () => ({
    flex: "none"
  }),
  (props: InteractiveProps) => <Interactive {...props} />
)
type SidebarPosition = "left" | "top" | "right" | "bottom"

const SidebarContainer = makeRootView(theme => ({ ...theme.sidebar }), FlexColumn, props => ({
  backgroundColor: props.backgroundColor || props.theme.colors.backgroundStatus,
  borderLeft: props.position === "right" ? `1px solid ${props.theme.colors.border}` : "none",
  borderTop: props.position === "bottom" ? `1px solid ${props.theme.colors.border}` : "none",
  borderRight: props.position === "left" ? `1px solid ${props.theme.colors.border}` : "none",
  borderBottom: props.position === "top" ? `1px solid ${props.theme.colors.border}` : "none",
  textOverflow: props.overflow ? "ellipsis" : "auto",
  whiteSpace: props.overflow ? "nowrap" : "normal",
  height: "100%",
  overflowX: "hidden",
  overflowY: "auto"
})) //['floating','padded','collapsed','overflow','position','backgroundColor']));

type SidebarProps = {
  position: SidebarPosition,
  width?: number,
  minWidth?: number,
  maxWidth?: number,
  height?: number,
  minHeight?: number,
  maxHeight?: number,
  backgroundColor?: string,
  onResize?: (width: number, height: number) => void,
  children?: React.ReactNode,
  className?: string
}
type SidebarState = {
  width?: number,
  height?: number,
  userChange: boolean
}
/**
 * A resizable sidebar.
 */

export default class Sidebar extends Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps, context: Object) {
    super(props, context)
    this.state = {
      userChange: false,
      width: props.width,
      height: props.height
    }
  }

  static defaultProps = {
    position: "left"
  }

  componentWillReceiveProps(nextProps: SidebarProps) {
    if (!this.state.userChange) {
      this.setState({
        width: nextProps.width,
        height: nextProps.height
      })
    }
  }

  onResize = (width: number, height: number) => {
    const { onResize } = this.props

    if (onResize) {
      onResize(width, height)
    } else {
      this.setState({
        userChange: true,
        width,
        height
      })
    }
  }

  render() {
    const { backgroundColor, onResize, position, children } = this.props
    let height, minHeight, maxHeight, width, minWidth, maxWidth
    const resizable: {
      [key: string]: boolean
    } = {}

    if (position === "left") {
      resizable.right = true
      ;({ width, minWidth, maxWidth } = this.props)
    } else if (position === "top") {
      resizable.bottom = true
      ;({ height, minHeight, maxHeight } = this.props)
    } else if (position === "right") {
      resizable.left = true
      ;({ width, minWidth, maxWidth } = this.props)
    } else if (position === "bottom") {
      resizable.top = true
      ;({ height, minHeight, maxHeight } = this.props)
    }

    const horizontal = position === "left" || position === "right"

    if (horizontal) {
      width = width == null ? 200 : width
      minWidth = minWidth == null ? 100 : minWidth
      maxWidth = maxWidth == null ? 600 : maxWidth
    } else {
      height = height == null ? 200 : height
      minHeight = minHeight == null ? 100 : minHeight
      maxHeight = maxHeight == null ? 600 : maxHeight
    }

    return (
      <SidebarInteractiveContainer
        className={this.props.className}
        minWidth={minWidth}
        maxWidth={maxWidth}
        width={horizontal ? (onResize ? width : this.state.width) : undefined}
        minHeight={minHeight}
        maxHeight={maxHeight}
        height={!horizontal ? (onResize ? height : this.state.height) : undefined}
        resizable={resizable}
        onResize={this.onResize}
      >
        <SidebarContainer position={position} backgroundColor={backgroundColor}>
          {children}
        </SidebarContainer>
      </SidebarInteractiveContainer>
    )
  }
}
