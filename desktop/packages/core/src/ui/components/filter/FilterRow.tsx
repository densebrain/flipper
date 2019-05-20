/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Filter } from "./types"
import { PureComponent } from "react"
import ContextMenuComponent from "../ContextMenuComponent"
import textContent from "../../../utils/textContent"
import styled from "../../styled/index"
//import { colors } from "../../themes/colors"
import * as React from 'react'
import {Theme} from "../../themes"

const FilterText = styled("div")(({colors}:Theme) => ({
  display: "flex",
  alignSelf: "baseline",
  userSelect: "none",
  cursor: "pointer",
  position: "relative",
  maxWidth: "100%",
  "&:hover": {
    color: colors.textLight,
    zIndex: 2
  },
  "&:hover::after": {
    content: '""',
    position: "absolute",
    top: 2,
    bottom: 1,
    left: -6,
    right: -6,
    borderRadius: "999em",
    backgroundColor: colors.backgroundStatus,
    zIndex: -1
  },
  "&:hover *": {
    color: `${colors.textLight} !important`
  }
}))
type Props = {
  children: React.ReactNode,
  addFilter: (filter: Filter) => void,
  filterKey: string
}
export default class FilterRow extends PureComponent<Props> {
  onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      this.props.addFilter({
        type: e.metaKey || e.altKey ? "exclude" : "include",
        key: this.props.filterKey,
        value: textContent(this.props.children)
      })
    }
  }
  menuItems = [
    {
      label: "Filter this value",
      click: () =>
        this.props.addFilter({
          type: "include",
          key: this.props.filterKey,
          value: textContent(this.props.children)
        })
    }
  ]

  render() {
    const { children, ...props } = this.props
    return (
      <ContextMenuComponent items={this.menuItems} component={FilterText} onMouseDown={this.onMouseDown} {...props}>
        {children}
      </ContextMenuComponent>
    )
  }
}
