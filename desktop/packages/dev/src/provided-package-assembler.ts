import {fromJSON, getLogger, toJSON} from "@states/common"
import Bluebird from "bluebird"

import * as Path from 'path'
import * as Sh from 'shelljs'
import PQueue from 'p-queue'
import * as Fs from 'mz/fs'
import {packageDir, rootDir} from "./dirs"
import {addCompileEventHandler, CompilerEvent, PackageName} from "./package-compiler"

const
  {ShellString} = Sh,
  log = getLogger(__filename),
  assembleQueue = new PQueue({
    concurrency: 1
  })

async function prepareDeclarationPackage(name: "common" | "sdk") {
  try {
    const
      srcName = name === "common" ? "common" : "core",
      srcPkgDir = Path.join(packageDir, srcName),
      srcLibDir = Path.join(srcPkgDir, "lib"),
      pkgDir = Path.join(packageDir, name),
      outDir = Path.join(rootDir, "dist", "package", name),
      outLibDir = Path.join(outDir, "lib")
  
    if (!(await Fs.exists(srcLibDir))) {
      log.warn(`${name} lib folder does not exist: ${srcLibDir}`)
      return
    }
  
    Sh.mkdir("-p", outLibDir)
    const pkgJson = fromJSON(Sh.cat(Path.join(pkgDir, "package.json")))
  
    new ShellString(toJSON({
      ...pkgJson,
      main: "index.js"
    })).to(Path.join(outDir, "package.json"))
  
  
    const dtsFiles = Sh.find(srcLibDir).filter(file => file.endsWith(".d.ts"))
    dtsFiles.forEach(file => {
      const
        destFile = file.replace(srcLibDir, outLibDir),
        destDir = Path.dirname(destFile)
    
      Sh.mkdir("-p", destDir)
      Sh.cp(file, destFile)
    })
  
    new ShellString("module.exports = {}").to(Path.join(outDir, "index.js"))
  } catch (err) {
    log.error(`Unable to prepare provided package ${name}`, err)
  }
}

async function assembleSDK() {
  await prepareDeclarationPackage("sdk")
}


async function assembleCommon() {
  await prepareDeclarationPackage("common")
}

let
  buildCount = 0,
  commonComplete = false

export function assembleProvidedPackages(name: PackageName, event: CompilerEvent) {
  if (name === "common" && !commonComplete)
    commonComplete = true
  
  if (!commonComplete)
    return
  
  assembleQueue.add(async () => {
    buildCount++
    
    log.info(`Triggered Common/SDK build (${buildCount}) from ${name} with event ${event}`)
    
    await Bluebird.each(
      [assembleCommon, assembleSDK],
      fn => fn()
    )
    
    log.info(`Completed Common/SDK build (${buildCount}) from ${name} with event ${event}`)
  })
}

export function attachProvidedPackagesAssembler() {
  Array<PackageName>("common", "core").forEach(name => {
    Array<CompilerEvent>("first_success", "subsequent_success").forEach(event => {
      addCompileEventHandler(name, event, () =>
        assembleProvidedPackages(name, event)
      )
    })
  })
}
