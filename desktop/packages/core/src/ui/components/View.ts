/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'
import {makeRootView, RootView, RootViewProps} from "./RootView"

export type ViewProps = RootViewProps & {
  grow?: number | boolean | undefined
  scrollable?: boolean | undefined
}

export function makeView<Props extends ViewProps = ViewProps>(): React.ComponentType<Props> {
  return makeRootView<Props>(
    () => ({
      position: "relative",
      overflow: "visible",
      height: "auto",
      width: "auto"
    }),
    RootView,
    props => ({
      ...(props.grow
        ? {
          height: "100%",
          width: "100%"
        }
        : {}),
      ...(props.scrollable
        ? {
          overflow: "auto"
        }
        : {})
    })
  ) as React.ComponentType<Props> //(styleCreator(props => ,['grow','shrink','scrollable','buildItems','focused','filterKey','addFilter','justifyContent','multiline','backgroundColor']));
}

const View = makeView()

export default View
