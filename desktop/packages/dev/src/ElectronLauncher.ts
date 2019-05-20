import * as ChildProcess from "child_process"
import {getValue} from "typeguard"
import * as URL from "url"
import {rootDir} from "./dirs"
import {getLogger} from "@flipper/common"
import {WebpackOutputMap} from "./webpack.types"

const
  ElectronBinary:string = require('electron') as any,
  log = getLogger((__filename))

let proc: ChildProcess.ChildProcess | null = null

let compiledPackages:WebpackOutputMap = {}

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

function getPackageBundleURL(name: string, ext: string = ".js", initial: boolean = true): string {
  return URL.format({
    pathname: getPackageBundle(name,ext, initial),
    protocol: 'file:',
    slashes: true,
  });
}

function onElectronClose() {

}

function onStart() {
  if (proc) {
    log.info("Closing electron process")
    
    proc.off('close',onElectronClose)
    proc.kill();
    proc = null
  }
}

process.on('exit', onStart);

export function startElectron(packages:WebpackOutputMap) {
  log.info("Checking for existing process", packages)
  onStart()
  
  log.info("Starting electron process")
  compiledPackages = packages
  
  const
    appFilename = getPackageBundle("app"),
    args = [
      appFilename,
      '--remote-debugging-port=9230',
      //...process.argv,
    ]
  
  log.info(`Binary: ${appFilename}, Args: ${args.join(', ')}`)
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
