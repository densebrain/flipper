/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import * as Electron from 'electron'
import FlexColumn from "./FlexColumn"
import {ContextMenuContext, ContextMenuContextConsumer} from "./ContextMenuContext"
import {HTMLAttributes} from "react"
export type MenuTemplate = Array<Electron.MenuItemConstructorOptions>
type Props = {
  items?: MenuTemplate,
  buildItems?: () => MenuTemplate,
  children: React.ReactNode,
  component: React.ComponentType<any> | string
} & HTMLAttributes<any>
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
  
  private onContextMenu = (_e: React.MouseEvent, {appendToContextMenu}: ContextMenuContext ) => {
    if (this.props.items != null) {
      appendToContextMenu(this.props.items)
    } else if (this.props.buildItems != null) {
      appendToContextMenu(this.props.buildItems())
    }
  }

  render() {
    const { items: _items, buildItems: _buildItems, component, children, ...props } = this.props
    return <ContextMenuContextConsumer>{ context => !context ? null : React.createElement(
      component,
      {
        onContextMenu: (e:React.MouseEvent) => this.onContextMenu(e,context),
        ...props
      },
      children
    )}
      </ContextMenuContextConsumer>
  }
}
