/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import FlexRow from "./FlexRow"
import FlexBox from "./FlexBox"
import {makeRootView, RootViewProps} from "./RootView"
/**
 * A toolbar.
 */

export type ToolbarProps = RootViewProps & {
  position?: "top" | "left" | "right" | "bottom" | undefined
  compact?: boolean | undefined
}

const Toolbar = makeRootView(
  theme => {
    const { colors } = theme
    return {
      backgroundColor: colors.backgroundStatus,
      borderBottom: (props: ToolbarProps) => (props.position === "bottom" ? "none" : `1px solid ${colors.border}`),
      borderTop: (props: ToolbarProps) => (props.position === "bottom" ? `1px solid ${colors.border}` : "none"),
      flexShrink: 0,
      height: (props: ToolbarProps) => (props.compact ? 28 : 42),
      lineHeight: "32px",
      alignItems: "center",
      padding: 6,
      width: "100%",
      ...S.FillWidth
    }
  },
  FlexRow,
  "Toolbar"
)

export const Spacer = makeRootView(
  () => ({
    flexGrow: 1
  }),
  FlexBox,
  "Spacer"
)
export default Toolbar
