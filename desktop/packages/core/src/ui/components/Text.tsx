/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import * as React from 'react'
import {withStyles, Theme, ThemeProps} from "../themes"
import filterProps from "react-valid-props"
import * as CSS from 'csstype'
import {HTMLAttributes} from "react"
/**
 * A Text component.
 */

export type TextProps = HTMLAttributes<HTMLSpanElement> & ThemeProps<{
  color?: CSS.ColorProperty | undefined
  italic?: CSS.FontStyleProperty | undefined
  align?: CSS.TextAlignProperty | undefined
  size?: CSS.FontSizeProperty<any> | undefined
  code?: boolean | undefined
  selectable?: boolean | undefined
  whiteSpace?: boolean | undefined
  bold?: boolean | undefined
  family?: CSS.FontFamilyProperty | undefined
  wordWrap?: CSS.WordWrapProperty | undefined
},"root",false>

const Text = withStyles(({ colors }: Theme) => ({
  root: {
    color: (props: TextProps) => props.color || colors.text,
    display: "inline",
    fontWeight: (props: TextProps) => (props.bold ? "bold" : "inherit"),
    fontStyle: (props: TextProps) => (props.italic ? "italic" : "normal"),
    textAlign: (props: TextProps) => props.align || "left",
    fontSize: (props: TextProps) => (props.size == null && props.code ? 12 : props.size),
    fontFamily: (props: TextProps) => (props.code ? "SF Mono, Monaco, Andale Mono, monospace" : props.family),
    overflow: (props: TextProps) => (props.code ? "auto" : "visible"),
    userSelect: (props: TextProps) =>
      props.selectable || (props.code && props.selectable !== true) ? "text" : "none",
    wordWrap: (props: TextProps) => (props.code ? "break-word" : props.wordWrap),
    whiteSpace: (props: TextProps) => (props.code && typeof props.whiteSpace === "undefined" ? "pre" : props.whiteSpace)
  }
}))(
  React.forwardRef<HTMLSpanElement,TextProps>(({ classes, className, style, children, ...other }:TextProps, ref) => {
    return (
      <span ref={ref} className={`${classes.root} ${className}`} style={style} {...filterProps(other)}>
        {children}
      </span>
    )
  })
)
export default Text
