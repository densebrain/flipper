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
import {
  TableColumnOrder,
  TableColumnSizes,
  TableColumns,
  TableOnColumnResize,
  TableOnSort,
  TableRowSortOrder
} from "./types"
import { normaliseColumnWidth, isPercentage } from "./utils"
import { PureComponent } from "react"
import ContextMenuComponent from "../ContextMenuComponent"
import Interactive from "../Interactive"
import styled from "../../styled/index"
import FlexRow from "../FlexRow"
import { styleCreator } from "../../styled/index"
import { lighten } from "@material-ui/core/styles/colorManipulator"
import { makeRootView } from "../RootView"
import { ThemeProps } from "../../themes"
import * as React from "react"
import { isNumber } from "typeguard"

const invariant = require("invariant")

type MenuTemplate = Array<Electron.MenuItemConstructorOptions>
const TableHeaderArrow = styled("span")(({ theme }) => ({
  float: "right",
  color: theme.colors.text
}))
const TableHeaderColumnInteractive = styled(Interactive)({
  display: "inline-block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%"
})
const TableHeaderColumnContainer = makeRootView(() => ({
  padding: "0 8px"
}))
const TableHeadContainer = styled(FlexRow)(({ theme }) => ({
  borderBottom: `1px solid ${theme.colors.border}`,
  color: theme.colors.text,
  flexShrink: 0,
  left: 0,
  overflow: "hidden",
  right: 0,
  textAlign: "left",
  top: 0,
  zIndex: 2
}))

type TableHeadColumnContainerProps = ThemeProps<
  {
    width?: number | string
  },
  string,
  true
>
const TableHeadColumnContainer = styled("div")(
  styleCreator(
    (props: TableHeadColumnContainerProps) => ({
      position: "relative",
      backgroundColor: lighten(props.theme.colors.backgroundStatus, 0.15),
      flexShrink: props.width === "flex" ? 1 : 0,
      height: 23,
      lineHeight: "23px",
      fontSize: "0.85em",
      fontWeight: 500,
      width: props.width === "flex" ? "100%" : props.width,
      "&::after": {
        position: "absolute",
        content: '""',
        right: 0,
        top: 5,
        height: 13,
        width: 1,
        background: lighten(props.theme.colors.backgroundStatus, 0.45)
      },
      "&:last-child::after": {
        display: "none"
      }
    }),
    ["backgroundColor"]
  )
)
const RIGHT_RESIZABLE = {
  right: true
}

function calculatePercentage(parentWidth: number, selfWidth: number): string {
  return `${(100 / parentWidth) * selfWidth}%`
}

class TableHeadColumn extends PureComponent<{
  id: string
  width: string | number
  sortable: boolean | null | undefined
  isResizable: boolean
  leftHasResizer: boolean
  hasFlex: boolean
  sortOrder: TableRowSortOrder | null | undefined
  onSort: TableOnSort | null | undefined
  columnSizes: TableColumnSizes
  onColumnResize: TableOnColumnResize | null | undefined
  children?: React.ReactNode
  title?: string
}> {
  ref: HTMLElement
  onClick = () => {
    const { id, onSort, sortOrder } = this.props
    const direction =
      sortOrder && sortOrder.key === id && sortOrder.direction === "down"
        ? "up"
        : "down"

    if (onSort) {
      onSort({
        direction,
        key: id
      })
    }
  }
  onResize = (newWidth: number | string) => {
    const { id, columnSizes, onColumnResize, width } = this.props

    if (!onColumnResize) {
      return
    }

    let normalizedWidth = newWidth // normalise number to a percentage if we were originally passed a percentage

    if (isPercentage(width)) {
      const { parentElement } = this.ref
      invariant(parentElement, "expected there to be parentElement")
      const parentWidth = parentElement.clientWidth
      const { childNodes } = parentElement
      const lastElem = childNodes[childNodes.length - 1]
      const right =
        lastElem instanceof HTMLElement
          ? lastElem.offsetLeft + lastElem.clientWidth + 1
          : 0

      if (isNumber(newWidth) && right < parentWidth) {
        normalizedWidth = calculatePercentage(parentWidth, newWidth)
      }
    }

    onColumnResize({ ...columnSizes, [id]: normalizedWidth })
  }
  setRef = (ref: HTMLElement) => {
    this.ref = ref
  }

  render() {
    const { isResizable, sortable, width, title } = this.props
    let { children } = this.props
    children = (
      <TableHeaderColumnContainer>{children}</TableHeaderColumnContainer>
    )

    if (isResizable) {
      children = (
        <TableHeaderColumnInteractive
          grow={true}
          resizable={RIGHT_RESIZABLE}
          onResize={this.onResize}
        >
          {children}
        </TableHeaderColumnInteractive>
      )
    }

    return (
      <TableHeadColumnContainer
        width={width}
        title={title}
        onClick={sortable === true ? this.onClick : undefined}
        innerRef={this.setRef}
      >
        {children}
      </TableHeadColumnContainer>
    )
  }
}

export default class TableHead extends PureComponent<{
  columnOrder: TableColumnOrder
  onColumnOrder: (order: TableColumnOrder) => void | null | undefined
  columns: TableColumns
  sortOrder: TableRowSortOrder | null | undefined
  onSort: TableOnSort | null | undefined
  columnSizes: TableColumnSizes
  onColumnResize: TableOnColumnResize | null | undefined
}> {
  buildContextMenu = (): MenuTemplate => {
    const visibles = this.props.columnOrder
      .map(c => (c.visible ? c.key : null))
      .filter(Boolean)
      .reduce((acc, cv) => {
        acc.add(cv)
        return acc
      }, new Set())
    return Object.keys(this.props.columns).map(key => {
      const visible = visibles.has(key)
      return {
        label: this.props.columns[key].value,
        click: () => {
          const { onColumnOrder, columnOrder } = this.props

          if (onColumnOrder) {
            const newOrder = columnOrder.slice()
            let hasVisibleItem = false

            for (let i = 0; i < newOrder.length; i++) {
              const info = newOrder[i]

              if (info.key === key) {
                newOrder[i] = {
                  key,
                  visible: !visible
                }
              }

              hasVisibleItem = hasVisibleItem || newOrder[i].visible
            } // Dont allow hiding all columns

            if (hasVisibleItem) {
              onColumnOrder(newOrder)
            }
          }
        },
        type: "checkbox",
        checked: visible
      }
    })
  }

  render() {
    const {
      columnOrder,
      columns,
      columnSizes,
      onColumnResize,
      onSort,
      sortOrder
    } = this.props
    const elems = []
    let hasFlex = false

    for (const column of columnOrder) {
      if (column.visible && columnSizes[column.key] === "flex") {
        hasFlex = true
        break
      }
    }

    let lastResizable = true
    const colElems: { [key: string]: React.ReactNode } = {}

    for (const column of columnOrder) {
      if (!column.visible) {
        continue
      }

      const key = column.key
      const col = columns[key]
      let arrow

      if (col.sortable === true && sortOrder && sortOrder.key === key) {
        arrow = (
          <TableHeaderArrow>
            {sortOrder.direction === "up" ? "▲" : "▼"}
          </TableHeaderArrow>
        )
      }

      const width = normaliseColumnWidth(columnSizes[key])
      const isResizable = col.resizable !== false
      const elem = (
        <TableHeadColumn
          key={key}
          id={key}
          hasFlex={hasFlex}
          isResizable={isResizable}
          leftHasResizer={lastResizable}
          width={width}
          sortable={col.sortable}
          sortOrder={sortOrder}
          onSort={onSort}
          columnSizes={columnSizes}
          onColumnResize={onColumnResize}
          title={key}
        >
          {col.value}
          {arrow}
        </TableHeadColumn>
      )
      elems.push(elem)
      colElems[key] = elem
      lastResizable = isResizable
    }

    return (
      <ContextMenuComponent buildItems={this.buildContextMenu}>
        <TableHeadContainer>{elems}</TableHeadContainer>
      </ContextMenuComponent>
    )
  }
}
