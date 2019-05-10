/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {HTMLAttributes, PureComponent} from "react"
import Text, {TextProps} from "../Text"
import * as React from 'react'
import {ThemeProps, withStyles} from "../../themes"
import { findDOMNode } from "react-dom"

import Electron from "electron"
import { lighten } from "@material-ui/core/styles/colorManipulator"
import {Theme} from "../../../../dist/src/ui/themes"
import {Filter, FilterType, isFilterPersistent, isFilterType} from "../filter/types"
import {isString} from "typeguard"


type TokenProps = HTMLAttributes<any> & ThemeProps<{
  focused: boolean
},"root", false>
const Token = withStyles(({ colors }: Theme) => ({
  root: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: ({ focused, color }: TokenProps) =>
      focused ? colors.backgroundSelected : color || lighten(colors.background, 0.1),
    border: ({ focused }: TokenProps) => (focused ? "none" : colors.border),
    borderRadius: 4,
    marginRight: 4,
    padding: 4,
    paddingLeft: 6,
    height: 21,
    color: ({ focused }: TokenProps) => (focused ? colors.textSelected : colors.text),
    "&:active": {
      backgroundColor: colors.backgroundSelected,
      color: colors.textSelected
    },
    "&:first-of-type": {
      marginLeft: 3
    }
  }
}))(
  React.forwardRef(({ style, classes, focused, className, ...other }: TokenProps, ref) => {
    return <Text innerRef={ref} style={style} className={`${classes.root} ${className}`} {...other} />
  })
)

type KeyProps = HTMLAttributes<any> & ThemeProps<{
  type: FilterType
},"root", false>

const Key = withStyles(({ colors }: Theme) => ({
  root: {
    position: "relative",
    fontWeight: 500,
    paddingRight: 12,
    textTransform: "capitalize",
    lineHeight: "21px",
    "&:after": {
      content: ({ type }:KeyProps) => (type === "exclude" ? '"≠"' : '"="'),
      paddingLeft: 5,
      position: "absolute",
      top: -1,
      right: 0,
      fontSize: 14
    },
    "&:active:after": {
      backgroundColor: colors.backgroundSelected
    }
  }
}))(function Key({ style, classes, className, ...other }:KeyProps) {
  return <Text style={style} className={`${classes.root} ${className}`} {...other} />
})


const Value = withStyles(() => ({
  root: {
    whiteSpace: "nowrap",
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "21px",
    paddingLeft: 3
  }
}))(function Value({ style, classes, className, ...other }: TextProps) {
  return <Text style={style} className={`${classes.root} ${className}`} {...other} />
})

type ChevronProps = HTMLAttributes<HTMLDivElement>& ThemeProps<{
  focused?: boolean | undefined
},"root",false>
const Chevron = withStyles(({ colors }: Theme) => ({
  root: {
    border: 0,
    paddingLeft: 3,
    paddingRight: 1,
    marginRight: 0,
    fontSize: 16,
    backgroundColor: "transparent",
    position: "relative",
    top: -2,
    height: "auto",
    lineHeight: "initial",
    color: ({ focused }:ChevronProps) => (focused ? colors.textSelected : "inherit"),
    "&:hover, &:active, &:focus": {
      color: "inherit",
      border: 0,
      backgroundColor: "transparent"
    }
  }
}))(function Chevron({ classes, focused, style, className, ...other }:ChevronProps) {
  return <div style={style} className={`${classes.root} ${className}`} {...other} />
})
type Props = {
  filter: Filter,
  focused: boolean,
  index: number,
  onFocus: (focusedToken: number) => void,
  onBlur: () => void,
  onDelete: (deletedToken: number) => void,
  onReplace: (index: number, filter: Filter) => void
}
export default class FilterToken extends PureComponent<Props> {
  _ref: HTMLElement | null | undefined
  onMouseDown = () => {
    const {onFocus,filter, index} = this.props
    if (!isFilterPersistent(filter)) {
      onFocus(index)
    }

    this.showDetails()
  }
  showDetails = () => {
    const
      menuTemplate = Array<Electron.MenuItemConstructorOptions>(),
      {filter, onDelete, index} = this.props
    
    if (isFilterType(filter, "enum")) {
      menuTemplate.push(
        ...filter.enum.map(({ value, label }) => ({
          label,
          click: () => this.changeEnum(value),
          type: "checkbox" as any,
          checked: filter.value.indexOf(value) > -1
        }))
      )
    } else {
      if (isString(filter.value) && filter.value.length > 23) {
        menuTemplate.push(
          {
            label: filter.value,
            enabled: false
          },
          {
            type: "separator"
          }
        )
      }

      menuTemplate.push(
        {
          label:
            isFilterType(filter, "include")
              ? `Entries excluding "${filter.value}"`
              : `Entries including "${filter.value}"`,
          click: this.toggleFilter
        },
        {
          label: "Remove this filter",
          click: () => onDelete(index)
        }
      )
    }

    const menu = Electron.remote.Menu.buildFromTemplate(menuTemplate)
    
    const element = this._ref
    if (!element) return
    
    const { bottom, left } = element.getBoundingClientRect()
    menu.popup({
      window: Electron.remote.getCurrentWindow(),
      x: left,
      y: bottom + 8
    })
  }
  toggleFilter = () => {
    const { filter, index } = this.props

    if (filter.type !== "enum") {
      const newFilter: Filter<any> = { ...filter, type: filter.type === "include" ? "exclude" : "include" }
      this.props.onReplace(index, newFilter)
    }
  }
  changeEnum = (newValue: string) => {
    const { filter, index } = this.props

    if (isFilterType(filter, "enum")) {
      let { value } = filter

      if (value.indexOf(newValue) > -1) {
        value = value.filter(v => v !== newValue)
      } else {
        value = value.concat([newValue])
      }

      if (value.length === filter.enum.length) {
        value = []
      }

      const newFilter: Filter = {
        type: "enum" as FilterType,
        ...filter,
        value
      }
      this.props.onReplace(index, newFilter)
    }
  }
  setRef = (ref: HTMLElement) => {
    const element = findDOMNode(ref)

    if (element instanceof HTMLElement) {
      this._ref = element
    }
  }

  render() {
    const { filter, focused } = this.props
    let color
    let value: string | string[] = ""

    if (isFilterType(filter,"enum")) {
      const getEnum = <F extends Filter<"enum"> = Filter<"enum">, V extends F["value"][0] = F["value"][0]>(value: V) => filter.enum.find(e => e.value === value)

      const firstValue = getEnum(filter.value[0])
      const secondValue = getEnum(filter.value[1])

      if (filter.value.length === 0) {
        value = "All"
      } else if (filter.value.length === 2 && firstValue && secondValue) {
        value = `${firstValue.label} or ${secondValue.label}`
      } else if (filter.value.length === 1 && firstValue) {
        value = firstValue.label
        color = firstValue.color
      } else if (firstValue) {
        value = `${firstValue.label} or ${filter.value.length - 1} others`
      }
    } else {
      value = filter.value
    }

    return (
      <Token
        key={`${filter.key}:${value}=${filter.type}`}
        tabIndex={-1}
        onMouseDown={this.onMouseDown}
        focused={focused}
        color={color}
        innerRef={this.setRef}
      >
        <Key type={filter.type} focused={focused}>
          {filter.key}
        </Key>
        <Value>{value}</Value>
        <Chevron tabIndex={-1} focused={focused}>
          &#8964;
        </Chevron>
      </Token>
    )
  }
}
