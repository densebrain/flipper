
import * as Os from "os"
import * as Path from 'path'
import * as Fs from 'fs'
import {getLogger} from "../logging/Logger"
import {isWindows} from "./ElectronUtil"
import * as shx from 'shelljs'
import * as _ from 'lodash'

const log = getLogger(__filename)

export function mkdirs(dir:string):boolean {
  const parts = dir.split(Path.sep).filter(part => part && part.length)
  let path = ""
  for (const part of parts) {
    path = `${path}${_.isEmpty(path) && isWindows() ? "" : Path.sep}${part}`
    if (!Fs.existsSync(path)) {
      log.info("Making dir", path)
      Fs.mkdirSync(path)
      if (!Fs.existsSync(path)) {
        log.error("Unable to create path", path,"of", dir,"parts",parts)
        return false
      }
    }
  }

  if (!Fs.existsSync(dir)) {
    log.error("Unable to create path", path,"of", dir,"parts",parts)
    return false
  }
  

  return true
}



/**
 * File exists
 *
 * @param filename
 * @returns {Promise<boolean>}
 */
export function fileExists(filename: string): boolean {
  try {
    return Fs.existsSync(filename)
  } catch (err) {
    return false
  }
}


/**
 * Is a file a directory
 * @param dirname
 * @returns {boolean}
 */
export function isDirectory(dirname: string): boolean {
  try {
    return Fs.statSync(dirname).isDirectory()
  } catch (err) {
    return false
  }
}

export function createDirectory(dirname: string): boolean {
  try {
    if (!Fs.existsSync(dirname)) {
      //fs.mkdirSync(dirname)
      shx.mkdir('-p', dirname)
    }
    return true
  } catch (err) {
    log.error(`Unable to create directory: ${dirname}`, err)
    return false
  }
}


if (!process.env.ANDROID_HOME) {
  process.env.ANDROID_HOME = "/opt/android_sdk"
} // emulator/emulator is more reliable than tools/emulator, so prefer it if
// it exists

process.env.PATH = `${process.env.ANDROID_HOME}/emulator:${process.env.ANDROID_HOME}/tools:${process.env.PATH}` // ensure .flipper folder and config exist

export const flipperDir = Path.join(Os.homedir(), ".flipper")


export function getUserDataDir():string {
  return flipperDir
}
