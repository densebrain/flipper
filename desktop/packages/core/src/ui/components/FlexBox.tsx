/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
// @ts-ignore
import * as React from 'react'
import {makeView} from "./View"
import {makeRootView, RootViewProps} from "./RootView"
import {Theme} from "../themes"
export type FlexBoxProps = RootViewProps & {
  shrink: number
}

/**
 * A container using flexbox to layout its children
 */
export default makeRootView<FlexBoxProps>(
  (_theme:Theme) => ({
    display: "flex"
  }),
  makeView<FlexBoxProps>(),
  "FlexBox",
  props => ({
    flexShrink: !props.shrink || props.shrink ? 1 : 0
  })
)
