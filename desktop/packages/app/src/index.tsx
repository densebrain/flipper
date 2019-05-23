

/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */



import * as Electron from "electron"

import * as Fs from "fs"

import * as Path from "path"

import * as url from "url"
import {MainState} from "./types"
import * as _ from 'lodash'

const
  {app, session, BrowserWindow, ipcMain} = Electron,
  {env} = process as any



if (!app) {
  console.error("This is not a single instance")
  process.exit(0)
}

// disable electron security warnings:
// https://github.com/electron/electron/blob/master/docs/tutorial/security.md#security-native-capabilities-and-your-responsibility
env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

async function onReady() {
  
  const
    FlipperCommon = await import("@flipper/common"),
    {getLogger} = FlipperCommon,
    {setup} = await import("@flipper/init"),
    
    checkMacAppName = (await import("./env-fixes/mac-app-name")).default,
    delegateToLauncher = (await import("./launcher")).default,
    checkSingleInstance = (await import("./single-instance-check")).default,
    enableTracking = (await import("./tracking")).default
  
  const
    log = getLogger(__filename),
    options = FlipperArgs,
    state: MainState = {
      win: null,
      link: _.pick(options, 'url', 'file'),
      options
    },
    {config, configPath} = setup(options),
    pluginPaths = [...(config.pluginPaths || [])] as Array<string>

  process.env.CONFIG = JSON.stringify({...config, pluginPaths}) // possible reference to main app window
  
  const getWindow = () => {
    return state.win
  }
  
  if (!checkSingleInstance(app, getWindow)) return
  
  
  enableTracking(getWindow)
  
  checkMacAppName()
  
  app.on("window-all-closed", () => {
    app.quit()
  })
  
  app.on("will-finish-launching", () => {
    // Protocol handler for osx
    app.on("open-url", function (event, url) {
      event.preventDefault()
      state.link.url = url
      
      const win = getWindow()
      if (win) {
        win.webContents.send("flipper-protocol-handler", url)
      }
    })
    app.on("open-file", (event, file) => {
      // When flipper app is running, and someone double clicks the import file, `componentDidMount` will not be called
      // again and windows object will exist in that case. That's why calling
      // `win.webContents.send('open-flipper-file', filePath);` again.
      event.preventDefault()
  
      state.link.file = file
  
      const win = getWindow()
      if (win) {
        win.webContents.send("open-flipper-file", file)
      }
    })
  })
  
  
  ipcMain.on("componentDidMount", () => {
    const {url, file} = state.link
    const win = getWindow()
    if (url) {
      win.webContents.send("flipper-protocol-handler", url)
      state.link = {}
    }
    
    if (file) {
      // When flipper app is not running, the windows object might not exist in the callback of `open-file`, but after
      // ``componentDidMount` it will definitely exist.
      win.webContents.send("open-flipper-file", file)
      state.link = {}
    }
  })
  
  
  await import("./IPCHandlers")
  
  app.setAsDefaultProtocolClient("flipper")
  
  function tryCreateWindow() {
    log.info(`Creating window`)
    
    const win = state.win = new BrowserWindow({
      show: false, title: "Flipper", width: config.lastWindowPosition.width || 1400,
      height: config.lastWindowPosition.height || 1000, minWidth: 800, minHeight: 600, center: true,
      titleBarStyle: "hiddenInset", vibrancy: "sidebar",
      
      webPreferences: {
        nodeIntegration: true, webSecurity: false, scrollBounce: true, experimentalFeatures: true
      }
    })
    
    if (isDev) {
      win.once("ready-to-show", () => win.show())
    }
    
    win.once("close", () => {
      if (isDev) {
        // Removes as a default protocol for debug builds. Because even when the
        // production application is installed, and one tries to deeplink through
        // browser, it still looks for the debug one and tries to open electron
        app.removeAsDefaultProtocolClient("flipper")
      }
      
      
      const [x, y] = win.getPosition()
      const [width, height] = win.getSize() // save window position and size
      
      Fs.writeFileSync(configPath, JSON.stringify({
        ...config, lastWindowPosition: {
          x, y, width, height
        }
      }))
    })
    
    if (config.lastWindowPosition.x && config.lastWindowPosition.y) {
      win.setPosition(config.lastWindowPosition.x, config.lastWindowPosition.y)
    }
    
    const entryUrl = process.env.CORE_URL || url.format({
      pathname: Path.join(__dirname, "index.html"), protocol: "file:", slashes: true
    })
    
    console.info("Loading window with url", entryUrl, process.env.CORE_URL)
    if (process.env.NODE_ENV === "development") {
      win.show()
      win.webContents.openDevTools()
    }
    
    win.loadURL(entryUrl)
  }
  
  // HACK: patch webrequest to fix devtools incompatibility with electron 2.x.
  // See https://github.com/electron/electron/issues/13008#issuecomment-400261941
  session.defaultSession.webRequest.onBeforeRequest({urls: []}, (details, callback) => {
    if (details.url.indexOf('7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33') !== -1) {
      callback({
        redirectURL: details.url.replace(
          '7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33',
          '57c9d07b416b5a2ea23d28247300e4af36329bdc'
        )
      })
    } else {
      callback({ cancel: false })
    }
  })

  
  // If we delegate to the launcher, shut down this instance of the app.
  delegateToLauncher(options).then(hasLauncherInvoked => {
    if (hasLauncherInvoked) {
      app.quit()
      return
    }
    
    app.commandLine.appendSwitch("scroll-bounce")
    tryCreateWindow() // if in development install the react devtools extension
    
    if (isDev) {
      const {
        default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS
      } = require("electron-devtools-installer")
      
      installExtension(REACT_DEVELOPER_TOOLS.id)
      installExtension(REDUX_DEVTOOLS.id)
    }
  })
}

app.on("ready", onReady)
export {}
