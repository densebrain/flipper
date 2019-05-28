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
import * as React from "react"

import { HTMLAttributes, useEffect, useState } from "react"
import { Theme, ThemeProps, withStyles } from "../themes"
import {
  alpha,
  classNames,
  Fill,
  makeDimensionConstraints,
  makeMarginRem,
  PositionRelative,
  rem
} from "../styled"
import { FlexAuto } from "../styled/flex-styles"
import Posed from "react-pose"

type Props = HTMLAttributes<any>

const LogoWrapper = Posed.div({
  start: {
    rotate: 0
  },
  end: {
    rotate: "180deg",
    transition: { duration: 1000 }
  }
})

const LogoContent = (props: Props) => {
  const [stage, setStage] = useState<"start" | "end">("start"),
    [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    if (updateCount > 0) return
    let timer = window.setTimeout(() => {
      timer = 0
      setUpdateCount(oldCount => oldCount + 1)
      setStage(stage === "start" ? "end" : "start")
    }, 2000)

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  })

  return (
    <LogoWrapper {...props} pose={stage}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30.98 41.7">
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path d="M.89,0,6.56,8.12a15.19,15.19,0,0,1,6-2.62A15.34,15.34,0,0,1,25.45,8.82a15.37,15.37,0,0,1,4.21,5.66,15.74,15.74,0,0,1,1.3,7L30.09,41.7l-5.65-8.07a15.33,15.33,0,0,1-12.54,2.5,15.12,15.12,0,0,1-6.37-3.2,15.37,15.37,0,0,1-4.21-5.67,15.86,15.86,0,0,1-1.31-7q.15-3.37.44-10.12C.65,5.63.79,2.25.89,0ZM18.16,9.55a11.34,11.34,0,0,0-4.6-.14A11.29,11.29,0,0,0,6.22,14a11.49,11.49,0,0,0-1.91,4.17,11.35,11.35,0,0,0-.15,4.57A11.94,11.94,0,0,0,5.67,27a11.51,11.51,0,0,0,3,3.29,11.39,11.39,0,0,0,8.75,2.08,11.28,11.28,0,0,0,7.35-4.63,11.86,11.86,0,0,0,1.91-4.18,11.55,11.55,0,0,0-.15-6,11.41,11.41,0,0,0-3.08-5.11A11.06,11.06,0,0,0,18.16,9.55Z" />
          </g>
        </g>
      </svg>
    </LogoWrapper>
  )
}

export const Logo = withStyles(({ colors }: Theme) => ({
  root: {
    ...makeDimensionConstraints(rem(1.4)),
    ...makeMarginRem(0, 0.5),
    ...FlexAuto,
    ...PositionRelative,
    "& svg": {
      ...Fill,
      "& > g": {
        fill: alpha(colors.text, 0.8)
      }
    }
  }
}))(
  class extends React.Component<ThemeProps<Props, "root">> {
    render() {
      const { classes, className, ...other } = this.props
      return (
        <LogoContent
          className={classNames(classes.root, className)}
          {...other}
        />
      )
    }
  }
) as React.ComponentType<Props>
