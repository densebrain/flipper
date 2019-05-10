/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {Component, HTMLAttributes} from "react"
import Box from "./Box"
import * as React from 'react'
import styled from "../styled/index"
import {Theme} from "../themes"
const FocusableBoxBorder = styled(Box)(({colors}: Theme) => ({
  border: `1px solid ${colors.border}`,
  bottom: "0",
  left: "0",
  pointerEvents: "none",
  position: "absolute",
  right: "0",
  top: "0"
}))

type Props = HTMLAttributes<any> & {
  focusable?: boolean | undefined
}
export default class FocusableBox extends Component<
  Props,
  {
    focused: boolean
  }
> {
  
  static defaultProps = {
    focusable: true
  }
  
  constructor(props: Props, context: any) {
    super(props, context)
    
    this.state = {
      focused: false
    }
  }

  
  onBlur = (e: React.FocusEvent) => {
    const { onBlur } = this.props

    if (onBlur) {
      onBlur(e)
    }

    if (this.state.focused) {
      this.setState({
        focused: false
      })
    }
  }
  onFocus = (e: React.FocusEvent) => {
    const { onFocus } = this.props

    if (onFocus) {
      onFocus(e)
    }

    if (this.props.focusable) {
      this.setState({
        focused: true
      })
    }
  }

  render() {
    const { props } = this
    return (
      <Box {...props} onFocus={this.onFocus} onBlur={this.onBlur} tabIndex="0">
        {props.children}
        {this.state.focused && <FocusableBoxBorder />}
      </Box>
    )
  }
}
