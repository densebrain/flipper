/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'
import styled from "../styled/index"
import * as Electron from "electron"
import {ContextMenuContext, ContextMenuContextProvider, ContextMenuTemplate} from "./ContextMenuContext"




const Container = styled("div")({
  display: "contents"
})

interface Props {
  children: React.ReactNode
}
/**
 * States's root is already wrapped with this component, so plugins should not
 * need to use this. ContextMenu is what you probably want to use.
 */

export default class ContextMenuProvider extends React.Component<Props, {
  contextMenuContext: ContextMenuContext
}> {
  

  constructor(props:Props) {
    super(props)
    this.state = {
      contextMenuContext: {
        appendToContextMenu: this.appendToContextMenu.bind(this)
      }
    }
  }
  
  getContextMenuContext() {
    return {
    
    }
  }

  private menuTemplate: ContextMenuTemplate = []
  
  private appendToContextMenu(items: ContextMenuTemplate) {
    this.menuTemplate = this.menuTemplate.concat(items)
  }
  private onContextMenu = () => {
    const menu = Electron.remote.Menu.buildFromTemplate(this.menuTemplate)
    this.menuTemplate = []
    menu.popup({
      window: Electron.remote.getCurrentWindow()
    })
  }

  render() {
    return <ContextMenuContextProvider value={this.state.contextMenuContext}>
      <Container onContextMenu={this.onContextMenu}>{this.props.children}</Container>
    </ContextMenuContextProvider>
  }
}
