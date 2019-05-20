/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import FlexBox, {FlexBoxProps} from "./FlexBox"
import { makeRootView } from "./RootView"
/**
 * A container displaying its children in a column
 */

export default makeRootView<FlexBoxProps>(
  () => ({
    flexDirection: "column"
  }),
  FlexBox,
  "FlexColumn"
)
