/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import View from "./View"
import styled from "../styled/index"
import { makeRootView } from "./RootView"
type Props = {
  shrink: number
}
/**
 * A container using flexbox to layout its children
 */

export default makeRootView(
  theme => ({
    display: "flex"
  }),
  View,
  props => ({
    flexShrink: !props.shrink || props.shrink ? 1 : 0
  })
)
