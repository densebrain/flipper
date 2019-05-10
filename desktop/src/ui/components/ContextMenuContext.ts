import * as Electron from "electron"
import * as React from 'react'
export type ContextMenuTemplate = Array<Electron.MenuItemConstructorOptions>
export type ContextMenuContext = {
  appendToContextMenu: (items: ContextMenuTemplate) => void
}

const ContextProvider = React.createContext<ContextMenuContext>(null)

export const ContextMenuContextProvider = ContextProvider.Provider
export const ContextMenuContextConsumer = ContextProvider.Consumer
