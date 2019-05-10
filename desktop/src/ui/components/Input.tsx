/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import styled from "../styled"
import { withStyles } from "../themes"
import { Theme } from "../themes"
import { lighten } from "@material-ui/core/styles/colorManipulator"
import { Transparent } from "../styled"
import filterProps from "react-valid-props"
export const inputStyle = (theme: Theme) => {
  const { colors } = theme
  return {
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.backgroundInput,
    color: colors.textInput,
    borderRadius: 4,
    font: "inherit",
    fontSize: "1em",
    height: ({ compact }: any) => (compact ? "17px" : "28px"),
    lineHeight: ({ compact }: any) => (compact ? "17px" : "28px"),
    marginRight: 5,
    "&:disabled": {
      backgroundColor: lighten(colors.backgroundInput, 0.2),
      borderColor: Transparent,
      cursor: "not-allowed"
    }
  }
}
const Input = withStyles(theme => ({
  root: { ...inputStyle(theme), padding: ({ compact }) => (compact ? "0 5px" : "0 10px") }
}))(
  React.forwardRef(({ classes, className, style, children, ...other }, ref) => {
    return (
      <input
        ref={ref}
        className={`${classes.root} ${className}`}
        style={style}
        {...filterProps(other)}
        children={children}
      />
    )
  })
)
Input.defaultProps = {
  type: "text"
}
export default Input
