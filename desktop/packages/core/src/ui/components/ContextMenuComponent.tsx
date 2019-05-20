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
import {PropsOf} from "../themes"

export type MenuTemplate = Array<Electron.MenuItemConstructorOptions>

type Props<C extends (React.ComponentType<any> | string) = any> = {
  items?: MenuTemplate,
  buildItems?: () => MenuTemplate,
  children: React.ReactNode,
  component?: C
  componentProps?: C extends string ? HTMLAttributes<any> : Partial<PropsOf<C>>
} & HTMLAttributes<any>
/**
 * Native context menu that is shown on secondary click.
 * Uses [Electron's context menu API](https://electronjs.org/docs/api/menu-item)
 * to show menu items.
 *
 * Separators can be added by `{type: 'separator'}`
 */

export default class ContextMenuComponent extends React.Component<Props> {
  
  static defaultProps = {
    component: FlexColumn
  } as Props
  
  private onContextMenu = (_e: React.MouseEvent, {appendToContextMenu}: ContextMenuContext ) => {
    if (this.props.items != null) {
      appendToContextMenu(this.props.items)
    } else if (this.props.buildItems != null) {
      appendToContextMenu(this.props.buildItems())
    }
  }

  render() {
    const { items: _items, buildItems: _buildItems, component, componentProps = {}, children, ...other } = this.props
    return <ContextMenuContextConsumer>{ context => !context ? null : React.createElement(
      component,
      {
        onContextMenu: (e:React.MouseEvent) => this.onContextMenu(e,context),
        ...other,
        ...componentProps
      },
      children
    )}
      </ContextMenuContextConsumer>
  }
}
