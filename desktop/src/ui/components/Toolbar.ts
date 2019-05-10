/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import FlexRow from "./FlexRow"
import FlexBox from "./FlexBox"
import { makeRootView } from "./RootView"
/**
 * A toolbar.
 */

const Toolbar = makeRootView(theme => {
  const { colors } = theme
  return {
    backgroundColor: colors.backgroundStatus,
    borderBottom: props => (props.position === "bottom" ? "none" : `1px solid ${colors.border}`),
    borderTop: props => (props.position === "bottom" ? `1px solid ${colors.border}` : "none"),
    flexShrink: 0,
    height: props => (props.compact ? 28 : 42),
    lineHeight: "32px",
    alignItems: "center",
    padding: 6,
    width: "100%"
  }
}, FlexRow)
export const Spacer = makeRootView(
  theme => ({
    flexGrow: 1
  }),
  FlexBox
)
export default Toolbar
