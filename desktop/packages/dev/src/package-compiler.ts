import {getLogger} from "@flipper/common"
import TscWatch from "tsc-watch/client"
import * as Path from "path"
import { packageDir } from "./dirs"
import { addShutdownHook } from "./process"
import Bluebird from "bluebird"

const log = getLogger(__filename)

export type PackageName = "init" | "common" | "core" | "types" | "app"

export type CoreCompilerMap = {
  [name in PackageName]: PackageCompiler | null
}

export type PluginCompilerMap = {
  [pluginId: string]: PackageCompiler | null
}

export type CompilerMap = CoreCompilerMap & PluginCompilerMap

export const
  BasePackages = Array<PackageName>("types","common","init","core"),
  compilers: CompilerMap = {
    types: null,
    init: null,
    common: null,
    core: null,
    app: null
  }

export class PackageCompiler {
  watch = new TscWatch()

  static for(name: string) {
    return compilers[name] = compilers[name] || new PackageCompiler(name)
  }

  protected constructor(public name: string) {}

  on(
    event: "first_success" | "subsequent_success" | "compile_errors",
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
export async function compileBasePackages(once: boolean = false):Promise<CompilerMap> {
  
  log.info(`Compiling base packages`)
  
  await Bluebird.each(BasePackages, async (name) => {
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
  })
  
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
