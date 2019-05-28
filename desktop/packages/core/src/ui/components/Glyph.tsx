/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { HTMLAttributes } from "react"
import * as React from "react"
import { ThemedClassNames, withStyles } from "../themes"

const PropTypes = require("prop-types")

import { getIconUrl } from "../../utils/icons"

import filterProps from "react-valid-props"

const ColoredIconBlack = withStyles(() => ({
  root: {
    height: ({ size }: GlyphProps) => size,
    verticalAlign: "middle",
    width: ({ size }: GlyphProps) => size,
    flexShrink: 0
  }
}))(
  ({
    classes,
    className,
    style,
    ...other
  }: GlyphProps & { classes: ThemedClassNames<"root"> }) => (
    <img
      className={`${classes.root} ${className}`}
      style={style}
      {...filterProps(other)}
    />
  )
)
const ColoredIconCustom = withStyles(() => ({
  root: {
    height: (props: GlyphProps) => props.size,
    verticalAlign: "middle",
    width: (props: GlyphProps) => props.size,
    backgroundColor: (props: GlyphProps) => props.color,
    display: "inline-block",
    maskImage: (props: GlyphProps) => `url('${props.src}')`,
    maskSize: "100% 100%",
    WebkitMaskImage: (props: GlyphProps) => `url('${props.src}')`,
    WebkitMaskSize: "100% 100%",
    flexShrink: 0
  }
}))(
  ({
    classes,
    className,
    style,
    ...other
  }: GlyphProps & { classes: ThemedClassNames<"root"> }) => (
    <div
      className={`${classes.root} ${className}`}
      style={style}
      {...filterProps(other)}
    />
  )
)

function ColoredIcon(
  props: {
    name: string
    src: string
    size?: number
    className?: string
    color?: string
  },
  context: {
    glyphColor?: string
  }
) {
  const {
    className,
    color = className ? null : context.glyphColor,
    name,
    size = 16,
    src
  } = props
  const isBlack =
    !className &&
    (color == null ||
      color === "#000" ||
      color === "black" ||
      color === "#000000")

  if (isBlack) {
    return (
      <ColoredIconBlack
        alt={name}
        src={src}
        size={size}
        className={className}
      />
    )
  } else {
    return (
      <ColoredIconCustom
        color={color}
        size={size}
        src={src}
        className={className}
      />
    )
  }
}

ColoredIcon.contextTypes = {
  glyphColor: PropTypes.string
}
export type GlyphProps = HTMLAttributes<any> & {
  name: string
  size?: 8 | 10 | 12 | 16 | 18 | 20 | 24 | 32
  variant?: "filled" | "outline"
  className?: string
  color?: string
  src?: string | undefined
}

export default class Glyph extends React.PureComponent<GlyphProps> {
  render() {
    const { name, size, variant, color, className } = this.props
    return (
      <ColoredIcon
        name={name}
        className={className}
        color={color}
        size={size}
        src={getIconUrl(name, size, variant)}
      />
    )
  }
}
