/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import styled from "../styled/index"
import {SimpleThemeProps} from "../themes"
export const StyledButton = styled("div")(({toggled,theme:{colors}}: Props) => ({
  cursor: "pointer",
  width: "30px",
  height: "16px",
  background: toggled ? colors.backgroundSelected : colors.background,
  display: "block",
  borderRadius: "100px",
  position: "relative",
  marginLeft: "15px",
  "&::after": {
    content: '""',
    position: "absolute",
    top: "3px",
    left: toggled ? "18px" : "3px",
    width: "10px",
    height: "10px",
    background: "white",
    borderRadius: "100px",
    transition: "all cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s"
  }
}))
type Props = SimpleThemeProps & {
  onClick?: (event: React.MouseEvent) => void,
  toggled?: boolean
}
/**
 * Toggle Button.
 *
 * **Usage**
 *
 * ```jsx
 * import {ToggleButton} from "@stato/core";
 * <ToggleButton onClick={handler} toggled={boolean}/>
 * ```
 */

export default class ToggleButton extends React.Component<Props> {
  render() {
    return <StyledButton toggled={this.props.toggled} onClick={this.props.onClick} />
  }
}
