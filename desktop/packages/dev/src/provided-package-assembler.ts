import {getLogger} from "@flipper/common"
import Bluebird from "bluebird"

import * as Path from 'path'
import * as Sh from 'shelljs'
import PQueue from 'p-queue'
import {packageDir, rootDir} from "./dirs"
import {addCompileEventHandler, CompilerEvent, PackageName} from "./package-compiler"

const
  log = getLogger(__filename),
  assembleQueue = new PQueue({
    concurrency: 1
  })

function prepareDeclarationPackage(name: "common" | "sdk") {
  const
    srcName = name === "common" ? "common" : "core",
    srcPkgDir = Path.join(packageDir, srcName),
    srcLibDir = Path.join(srcPkgDir,"lib"),
    pkgDir = Path.join(packageDir,name),
    outDir = Path.join(rootDir, "dist", "package",name),
    outLibDir = Path.join(outDir, "lib")
  
  Sh.mkdir("-p", outLibDir)
  const pkgJson = JSON.parse(Sh.cat(Path.join(pkgDir, "package.json")))
  
  Sh.echo(JSON.stringify({
    ...pkgJson,
    main: "index.js"
  }, null, 2)).to(Path.join(outDir, "package.json"))
  
  
  const dtsFiles = Sh.find(srcLibDir).filter(file => file.endsWith(".d.ts"))
  dtsFiles.forEach(file => {
    const
      destFile = file.replace(srcLibDir, outLibDir),
      destDir = Path.dirname(destFile)
    
    Sh.mkdir("-p", destDir)
    Sh.cp(file, destFile)
  })
  
  Sh.echo("module.exports = {}").to(Path.join(outDir, "index.js"))
}

async function assembleSDK() {
  prepareDeclarationPackage("sdk")
}


async function assembleCommon() {
  prepareDeclarationPackage("common")
}

let buildCount = 0

export function assembleProvidedPackages(name: PackageName, event: CompilerEvent) {
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
