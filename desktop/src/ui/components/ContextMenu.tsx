/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import FlexColumn from "./FlexColumn"
import PropTypes from "prop-types"
export type MenuTemplate = Array<Electron$MenuItemOptions>
type Props = {
  items?: MenuTemplate,
  buildItems?: () => MenuTemplate,
  children: React.ReactNode,
  component: React.ComponentType<any> | string
}
/**
 * Native context menu that is shown on secondary click.
 * Uses [Electron's context menu API](https://electronjs.org/docs/api/menu-item)
 * to show menu items.
 *
 * Separators can be added by `{type: 'separator'}`
 */

export default class ContextMenu extends React.Component<Props> {
  static defaultProps = {
    component: FlexColumn
  }
  static contextTypes = {
    appendToContextMenu: PropTypes.func
  }
  onContextMenu = (e: SyntheticMouseEvent<>) => {
    if (typeof this.context.appendToContextMenu === "function") {
      if (this.props.items != null) {
        this.context.appendToContextMenu(this.props.items)
      } else if (this.props.buildItems != null) {
        this.context.appendToContextMenu(this.props.buildItems())
      }
    }
  }

  render() {
    const { items: _items, buildItems: _buildItems, component, ...props } = this.props
    return React.createElement(
      component,
      {
        onContextMenu: this.onContextMenu,
        ...props
      },
      this.props.children
    )
  }
}
