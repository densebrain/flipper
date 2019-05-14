/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { showOpenDialog } from "./utils/exportData"
import { setExportDataToFileActiveSheet, setActiveSheet, ACTIVE_SHEET_SHARE_DATA } from "./reducers/application"
import { Store } from "./reducers/"
import * as Electron from "electron"
import {MenuItemConstructorOptions, BrowserWindow} from 'electron'
import {Plugin, PluginComponent} from "./PluginTypes"
import {ENABLE_SHAREABLE_LINK} from "./fb-stubs/constants"

import * as os from "os"
import * as path from "path"
import {DefaultKeyboardAction, KeyboardAction, KeyboardActionHandler, KeyboardActions} from "./KeyboardTypes"
import {getLogger} from "./fb-interfaces/Logger"


const log = getLogger(__filename)
const { dialog } = Electron.remote
type MenuItem = {
  label?: string,
  accelerator?: string,
  role?: string,
  click?: Function,
  submenu?: Array<MenuItem>,
  type?: string,
  enabled?: boolean
}


const defaultKeyboardActions: Array<KeyboardAction> = [
  {
    label: "Clear",
    accelerator: "CmdOrCtrl+K",
    topLevelMenu: "View",
    action: "clear"
  },
  {
    label: "Go To Bottom",
    accelerator: "CmdOrCtrl+B",
    topLevelMenu: "View",
    action: "goToBottom"
  },
  {
    label: "Create Paste",
    topLevelMenu: "Edit",
    action: "createPaste"
  }
]

const menuItems = new Map<string, MenuItem>()
let pluginActionHandler: KeyboardActionHandler | null = null

function actionHandler(action: string) {
  if (pluginActionHandler) {
    pluginActionHandler(action)
  } else {
    console.warn(`Unhandled keyboard action "${action}".`)
  }
}

export function setupMenuBar(plugins: Array<Plugin>, store: Store) {
  const template = getTemplate(Electron.remote.app, Electron.remote.shell, store) // collect all keyboard actions from all plugins

  const registeredActions: Set<KeyboardAction> = new Set(
    plugins
      .map((plugin: Plugin) => plugin.componentClazz.keyboardActions || [])
      .reduce((acc: KeyboardActions, cv) => acc.concat(cv), [])
      .map((action: DefaultKeyboardAction | KeyboardAction) =>
        typeof action === "string" ? defaultKeyboardActions.find(a => a.action === action) : action
      )
  ) // add keyboard actions to

  registeredActions.forEach(keyboardAction => {
    if (keyboardAction != null) {
      appendMenuItem(template, actionHandler, keyboardAction)
    }
  }) // create actual menu instance

  const applicationMenu = Electron.remote.Menu.buildFromTemplate(template) // add menu items to map, so we can modify them easily later

  registeredActions.forEach(keyboardAction => {
    if (keyboardAction != null) {
      const { topLevelMenu, label, action } = keyboardAction
      const menu = applicationMenu.items.find(menuItem => menuItem.label === topLevelMenu) as Electron.MenuItemConstructorOptions | null

      if (menu) {
        // $FlowFixMe submenu is missing in Electron API spec
        const
          {submenu} = menu,
          menuItem = Array.isArray(submenu) ? null : submenu.items.find(menuItem => menuItem.label === label)
        if (!menuItem) {
          log.error(`Unable to find menu item: ${label}`)
        }
        menuItems.set(action, menuItem)
      }
    }
  }) // update menubar

  Electron.remote.Menu.setApplicationMenu(applicationMenu)
}

function appendMenuItem(
  template: Array<MenuItemConstructorOptions>,
  actionHandler: (action: string) => void,
  item: KeyboardAction | null | undefined
) {
  const keyboardAction = item

  if (keyboardAction == null) {
    return
  }

  const itemIndex = template.findIndex(menu => menu.label === keyboardAction.topLevelMenu)
  
  const menuItem = template[itemIndex]
  if (itemIndex > -1 && Array.isArray(menuItem.submenu)) {
    menuItem.submenu.push({
      click: () => actionHandler(keyboardAction.action),
      label: keyboardAction.label,
      accelerator: keyboardAction.accelerator,
      enabled: false
    })
  }
}

export function activateMenuItems(plugin: Plugin, component: PluginComponent) {
  const {componentClazz} = plugin
  
  // disable all keyboard actions
  for (const item of menuItems) {
    item[1].enabled = false
  } // set plugin action handler

  if (component.onKeyboardAction) {
    pluginActionHandler = component.onKeyboardAction
  } // enable keyboard actions for the current plugin

  const {keyboardActions} = componentClazz
  if (keyboardActions) {
    keyboardActions.forEach(keyboardAction => {
      const action = typeof keyboardAction === "string" ? keyboardAction : keyboardAction.action
      const item = menuItems.get(action)

      if (item != null) {
        item.enabled = true
      }
    })
  } // set the application menu again to make sure it updates

  Electron.remote.Menu.setApplicationMenu(Electron.remote.Menu.getApplicationMenu())
}

function getTemplate(app: Electron.App, shell: Electron.Shell, store: Store): MenuItemConstructorOptions[] {
  const exportSubmenu = [
    {
      label: "File...",
      accelerator: "CommandOrControl+E",
      click: function(_item: Object, _focusedWindow: Object) {
        dialog.showSaveDialog(
          null,
          {
            title: "FlipperExport",
            defaultPath: path.join(os.homedir(), "FlipperExport.flipper")
          },
          async file => {
            if (!file) {
              return
            }

            store.dispatch(setExportDataToFileActiveSheet(file))
          }
        )
      }
    }
  ]

  if (ENABLE_SHAREABLE_LINK) {
    exportSubmenu.push({
      label: "Sharable Link",
      accelerator: "CommandOrControl+Shift+E",
      click: async function(_item: Object, _focusedWindow: Object) {
        store.dispatch(setActiveSheet(ACTIVE_SHEET_SHARE_DATA))
      }
    })
  }

  const template:MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Open File...",
          accelerator: "CommandOrControl+O",
          click: function(_item: Object, _focusedWindow: Object) {
            showOpenDialog(store)
          }
        },
        {
          label: "Export",
          submenu: exportSubmenu
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          role: "undo"
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectall"
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: function(_item: Object, focusedWindow: BrowserWindow) {
            if (focusedWindow) {
              focusedWindow.reload()
            }
          }
        },
        {
          label: "Toggle Full Screen",
          accelerator: (function() {
            if (process.platform === "darwin") {
              return "Ctrl+Command+F"
            } else {
              return "F11"
            }
          })(),
          click: function(_item: Object, focusedWindow: BrowserWindow) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: (function() {
            if (process.platform === "darwin") {
              return "Alt+Command+I"
            } else {
              return "Ctrl+Shift+I"
            }
          })(),
          click: function(_item: Object, focusedWindow: BrowserWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools()
            }
          }
        },
        {
          type: "separator"
        }
      ]
    },
    {
      label: "Window",
      role: "window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "CmdOrCtrl+M",
          role: "minimize"
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          role: "close"
        }
      ]
    },
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Getting started",
          click: function() {
            shell.openExternal("https://fbflipper.com/docs/getting-started.html")
          }
        },
        {
          label: "Create plugins",
          click: function() {
            shell.openExternal("https://fbflipper.com/docs/create-plugin.html")
          }
        },
        {
          label: "Report problems",
          click: function() {
            shell.openExternal("https://github.com/facebook/flipper/issues")
          }
        }
      ]
    }
  ]

  if (process.platform === "darwin") {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [
        {
          label: "About " + name,
          role: "about",
          accelerator: null
        },
        {
          type: "separator"
        } as any,
        {
          label: "Services",
          role: "services",
          submenu: []
        },
        {
          type: "separator"
        },
        {
          label: "Hide " + name,
          accelerator: "Command+H",
          role: "hide"
        },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          role: "hideothers"
        },
        {
          label: "Show All",
          role: "unhide",
          accelerator: null
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            app.quit()
          }
        }
      ]
    })
    const windowMenu = template.find(m => {
      return m.role === "window"
    })

    if (windowMenu && Array.isArray(windowMenu.submenu)) {
      windowMenu.submenu.push(
        {
          type: "separator"
        } as any,
        {
          label: "Bring All to Front",
          role: "front"
        } as any
      )
    }
  }

  return template
}
