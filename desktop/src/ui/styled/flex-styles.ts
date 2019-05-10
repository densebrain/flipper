import { CSSProperties } from "@material-ui/styles/withStyles"
import { makeFlexAlign, makeStyle } from "./prebuilt-styles"
export const FlexAuto = makeFlex(0, 0, "auto")
/**
 * Create flex config, default is scale any size
 *
 * @param flexGrow
 * @param flexShrink
 * @param flexBasis
 */

export function makeFlex(flexGrow = 1, flexShrink = 1, flexBasis: number | string = 0): CSSProperties {
  return {
    flexGrow,
    flexShrink,
    flexBasis
  }
}
export const FlexAlignCenter = makeFlexAlign("center")
export const FlexAlignStart = makeFlexAlign("flex-start")
export const FlexAlignEnd = makeFlexAlign("flex-end")
export const FlexAlignSpaceBetween = makeFlexAlign("space-between")
export const FlexScale = makeFlex()
export const FlexWrap = {
  flexWrap: "wrap"
}
export const FlexNowrap = {
  flexWrap: "nowrap"
} //region Flexbox

export const Flex = {
  display: "flex"
}
export const FlexRow = makeStyle(Flex, {
  flexDirection: "row"
})
export const FlexRowReverse = makeStyle(Flex, {
  flexDirection: "row-reverse"
})
export const FlexRowCenter = makeStyle(FlexRow, FlexAlignCenter)
export const FlexColumn = makeStyle(Flex, {
  flexDirection: "column"
})
export const FlexColumnReverse = makeStyle(Flex, {
  flexDirection: "column-reverse"
})
export const FlexColumnCenter = makeStyle(FlexColumn, FlexAlignCenter)
