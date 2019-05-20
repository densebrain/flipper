/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import Interactive, {InteractiveProps} from "./Interactive"
import FlexColumn from "./FlexColumn"
import {darken} from "../themes"
import {Component} from "react"
import {makeRootView} from "./RootView"
import * as _ from 'lodash'

const SidebarInteractiveContainer = makeRootView<InteractiveProps>(
  () => ({
    flex: "none"
  }),
  (props: InteractiveProps) => <Interactive {...props} />
)
type SidebarPosition = "left" | "top" | "right" | "bottom"

const SidebarContainer = makeRootView(theme => ({ ...theme.sidebar }), FlexColumn, props => {
  const
    {position, overflow, backgroundColor, theme:{colors}} = props,
    border = darken(colors.border,0.2)
  
  return ({
  backgroundColor: backgroundColor || colors.backgroundStatus,
  borderLeft: position === "right" ? `1px solid ${border}` : "none",
  borderTop: position === "bottom" ? `1px solid ${border}` : "none",
  borderRight: position === "left" ? `1px solid ${border}` : "none",
  borderBottom: position === "top" ? `1px solid ${border}` : "none",
  textOverflow: overflow ? "ellipsis" : "auto",
  whiteSpace: overflow ? "nowrap" : "normal",
  height: "100%",
  overflowX: "hidden",
  overflowY: "auto"
})}) //['floating','padded','collapsed','overflow','position','backgroundColor']));

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
    const
      { backgroundColor, onResize, position, children, className, ...other } = this.props
    
    let wrapperProps = {
    
    } as Partial<InteractiveProps>
    //let height, minHeight, maxHeight, width, minWidth, maxWidth
    
    

    if ([ "left","right"].includes(position)) {
      wrapperProps = {
        resizable: {
          [position === "left" ? "right" : "left"]: true
        },
        ..._.pick(other,"width", "minWidth","maxWidth")
      }
    } else if (["top","bottom"].includes(position)) {
      wrapperProps = {
        resizable: {
          [position === "top" ? "bottom" : "top"]: true,
        },
        ..._.pick(other,"height", "minHeight","maxHeight")
      }
    }

    const horizontal = position === "left" || position === "right"

    if (horizontal) {
      const {width, minWidth, maxWidth} = wrapperProps
      wrapperProps = {
        ...wrapperProps,
        width: onResize ? (width == null ? 200 : width) : this.state.width,
        minWidth: minWidth == null ? 100 : minWidth,
        maxWidth: maxWidth == null ? 600 : maxWidth
      }
      
    } else {
      const {height, minHeight, maxHeight} = wrapperProps
      wrapperProps = {
        ...wrapperProps,
        height: onResize ? (height == null ? 200 : height) : this.state.height,
        minHeight: minHeight == null ? 100 : minHeight,
        maxHeight: maxHeight == null ? 600 : maxHeight
      }
      
    }

    return (
      <SidebarInteractiveContainer
        className={className}
        onResize={this.onResize}
        {...wrapperProps}
      >
        <SidebarContainer position={position} backgroundColor={backgroundColor}>
          {children}
        </SidebarContainer>
      </SidebarInteractiveContainer>
    )
  }
}
