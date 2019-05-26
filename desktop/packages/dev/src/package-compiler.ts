import {getLogger} from "@flipper/common"
import TscWatch from "tsc-watch/client"
import * as Path from "path"
import { packageDir } from "./dirs"
import { addShutdownHook } from "./process"
import Bluebird from "bluebird"
import * as _ from 'lodash'

const log = getLogger(__filename)

export type PackageName = "init" | "common" | "core" | "types" | "app"

export type CoreCompilerMap = {
  [name in PackageName]: PackageCompiler | null
}

export type PluginCompilerMap = {
  [pluginId: string]: PackageCompiler | null
}

export type CompilerMap = CoreCompilerMap & PluginCompilerMap

export const CompilerEvents = Array("first_success", "subsequent_success","compile_errors")
export type CompilerEvent = typeof CompilerEvents[number]

export type CompilerListenableEvent = CompilerEvent | "all"

export type CompilerEventHandler = (name: CompilePackageName, event: CompilerEvent, compiler: PackageCompiler) => void

export type CompilerEventHandlerMap = {[key in CompilerListenableEvent]: Array<CompilerEventHandler>}

type CompilePackageName = (keyof CompilerMap) | "all"

export const
  BasePackages = Array<PackageName>("types","common","init","core"),
  packageHandlers:{[key in CompilePackageName]?: CompilerEventHandlerMap} = {
  
  },
  compilers: CompilerMap = {
    types: null,
    init: null,
    common: null,
    core: null,
    app: null
  }
  
  
  
function getCompilerEventHandlers(name: CompilePackageName, event: CompilerListenableEvent): Array<CompilerEventHandler> {
  const pkgHandlers = packageHandlers[name] = packageHandlers[name] || {} as CompilerEventHandlerMap
  return pkgHandlers[event] = pkgHandlers[event] || Array<CompilerEventHandler>()

}

export function addCompileEventHandler(name: CompilePackageName, event: CompilerListenableEvent, handler: CompilerEventHandler) {
  getCompilerEventHandlers(name, event).push(handler)
}

function triggerCompileEvent(name: CompilePackageName, event: CompilerEvent, compiler: PackageCompiler) {
  _.uniq([
    ...getCompilerEventHandlers(name, event),
    ...getCompilerEventHandlers(name, "all"),
    ...getCompilerEventHandlers("all", event),
    ...getCompilerEventHandlers("all", "all")
  ]).forEach(fn => fn(name,event, compiler))
}

export class PackageCompiler {
  watch = new TscWatch()

  static for(name: string) {
    return compilers[name] = compilers[name] || new PackageCompiler(name)
  }

  protected constructor(public name: string) {
    CompilerEvents.forEach(event => {
      this.watch.on(event,() => triggerCompileEvent(name, event, this))
    })
    
  }

  on(
    event: CompilerEvent,
    fn: () => void
  ) {
    this.watch.on(event, fn)
    return this
  }

  start() {
    this.watch.start(
      "--noClear",
      "--project",
      Path.resolve(packageDir, this.name)
    )
    return this
  }

  kill() {
    this.watch.kill()
    return this
  }
}

export function makePackageCompiler(name: string): PackageCompiler {
  return PackageCompiler.for(name)
}

/**
 * Compile required base packages
 *
 * @returns {Promise<void>}
 */
export async function compileBasePackages(once: boolean = false, parallel: boolean = false):Promise<CompilerMap> {
  
  log.info(`Compiling base packages`)
  
  const pkgBuilder = async (name: string) => {
    let compiler: PackageCompiler | null = null
    try {
      compiler = makePackageCompiler(name)
      await new Promise<void>((resolve, reject) => {
      
        compiler.on("first_success", () => {
          log.info(`Completed: ${name}`)
          resolve()
        })
      
        compiler.on("compile_errors", () => {
          reject(new Error(`Failed to compile: ${name}`))
        })
        
        compiler.start()
      })
    } finally {
      if (compiler && once)
        compiler.kill()
    }
  }
  
  if (parallel)
    await Promise.all(BasePackages.map(pkgBuilder))
  else
    await Bluebird.each(BasePackages, pkgBuilder)
  
  return compilers
}



addShutdownHook(() => {
  Object.entries(compilers).forEach(([name, compiler]) => {
    if (compiler) {
      compiler.kill()
      delete compilers[name as PackageName]
    }
  })
})
