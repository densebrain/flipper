import * as ChildProcess from "child_process"
import {getValue} from "typeguard"
import * as URL from "url"
import {rootDir} from "./dirs"
import {getLogger} from "@states/common"
import {addShutdownHook} from "./process"
import {WebpackOutputMap} from "./webpack/webpack.types"

const
  ElectronBinary:string = require('electron') as any,
  log = getLogger((__filename))

let
  proc: ChildProcess.ChildProcess | null = null,
  compiledPackages:WebpackOutputMap = {}

/**
 * Get package bundle file
 *
 * @param {string} name
 * @param {string} ext
 * @param {boolean} initial
 * @returns {string}
 */
function getPackageBundle(name: string, ext: string = ".js", initial: boolean = true): string {
  const
    filename = getValue(() =>
      compiledPackages[name].filter(({filename, initial:isInitial}) =>
        filename.endsWith(ext) &&
        (initial ? (isInitial === true) : (isInitial !== true))
      )[0].filename,null)
  
  if (!filename) {
    throw new Error(`No assets for ${name} with ext ${ext}`)
  }
  return filename
}

/**
 * Get package bundle as a URL
 *
 * @param {string} name
 * @param {string} ext
 * @param {boolean} initial
 * @returns {string}
 */
function getPackageBundleURL(name: string, ext: string = ".js", initial: boolean = true): string {
  return URL.format({
    pathname: getPackageBundle(name,ext, initial),
    protocol: 'file:',
    slashes: true,
  });
}

/**
 * Listens for user requested electron quit
 */
function onElectronClose() {
  log.info("Electron quit, exiting dev-server")
  process.exit(0)
}

/**
 * Cleanup electron instance
 */
function cleanup() {
  if (proc) {
    log.info("Closing electron process")
    proc.off('close',onElectronClose)
    proc.kill();
    proc = null
  }
}

/**
 * Start electron dev instance
 *
 * @param {WebpackOutputMap} packages
 */
export function startElectron(packages:WebpackOutputMap) {
  log.debug("Checking for existing process", packages)
  cleanup()
  
  log.info("Starting electron process")
  compiledPackages = packages
  
  const
    appFilename = getPackageBundle("app"),
    args = [
      appFilename,
      '--remote-debugging-port=9230',
      //...process.argv,
    ]
  
  log.debug(`Binary: ${appFilename}, Args: ${args.join(', ')}`)
  proc = ChildProcess.spawn(ElectronBinary, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      SONAR_ROOT: process.cwd(),
      CORE_URL: getPackageBundleURL("core", ".html", false)
    },
    stdio: 'inherit',
  });
  
  proc.on('close', onElectronClose);
  
  
}

// Setup shutdown hook
addShutdownHook(cleanup)
