/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import styled from "../styled/index"
import { inputStyle } from "./Input"
import {SimpleThemeProps} from "../themes"
import {HTMLAttributes} from "react"
type Props = SimpleThemeProps & HTMLAttributes<any> & {
  compact?: boolean
}

export default styled("textarea")(({ theme, compact }: Props) => ({
  ...inputStyle(theme),
  lineHeight: "normal",
  padding: compact ? "5px" : "8px",
  resize: "none"
}))
