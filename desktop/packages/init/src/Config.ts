

import * as Fs from 'fs'

import {Either} from "prelude-ts"

import {getLogger, getUserDataDir, EventHub, isMain,StatoConfig} from "@stato/common"
import  * as Electron from 'electron'
import {guard, isString} from "typeguard"



const log = getLogger(__filename)



let loaded = false

const config:StatoConfig = {
  pluginPaths: [],
  disabledPlugins: [],
  lastWindowPosition: {}
}

function getFilename():string {
  return `${getUserDataDir()}/config.json`
}

function patchFromDisk():void {
  const filename = getFilename()
  if (Fs.existsSync(filename)) {
    Either.try_(() => Fs.readFileSync(filename,'utf-8').toString(),{} as Error)
          .ifLeft(err => log.error("Unable to load config", err))
          .ifRight(json => updateConfig(JSON.parse(json) as StatoConfig,false))
  }
  
  EventHub.emit("ConfigChanged", config)
}

function load():void {
  if (loaded) return
  loaded = true
  patchFromDisk()
  
  const filename = getFilename()
  Fs.watchFile(filename, {
    persistent: false,
    interval: 500
  }, () => patchFromDisk())
}

function save():void {
  const filename = getFilename()
  guard(() => Fs.writeFileSync(filename, JSON.stringify(config, null, 2)))
}

export function updateConfig(patch:Partial<StatoConfig>, persist:boolean = true):StatoConfig {
  if (isString(Electron)) return {...config,...patch}
  
  if (isMain()) {
    Object.assign(config, patch)
    if (persist)
      save()
    return config
  } else {
    return Electron.ipcRenderer.sendSync("updateConfig", config)
  }
}

export function getConfig():StatoConfig {
  if (isString(Electron)) return config
  
  if (isMain()) {
    if (!loaded)
      load()
    
    return config
  } else {
    return Electron.ipcRenderer.sendSync("getConfig")
  }
}


if (!isString(Electron) && isMain()) {
  Electron.ipcMain.on("getConfig",(event:Electron.Event) => {
    event.returnValue = getConfig()
  })
  
  Electron.ipcMain.on("updateConfig",(event:Electron.Event, patch:Partial<StatoConfig>) => {
    event.returnValue = updateConfig(patch)
  })
}
