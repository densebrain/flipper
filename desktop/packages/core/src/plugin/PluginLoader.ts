import "@stato/types"
import {
  assert,
  fileExists,
  getLogger
} from "@stato/common"
import { Plugin, PluginMetadata, PluginModuleExport } from "../PluginTypes"
//import * as assert from "assert"
import Watch from "chokidar"
import { EventEmitter } from "events"
import PQueue from "p-queue"
import { IPackageJSON } from "package-json"
import * as Path from "path"
import patchRequire from "./PluginRequirePatch"



const
  NodeModule = nodeRequire("module") as typeof NodeJS.Module,
  log = getLogger(__filename),
  loaderMap: { [id: string]: PluginLoader } = {}
  

export class PluginLoader extends EventEmitter {
  static async load(
    metadata: PluginMetadata
  ): Promise<PluginLoader> {
    
    await patchRequire()
    
    const loader = (loaderMap[metadata.id] =
      loaderMap[metadata.id] || new PluginLoader(metadata.id))
    return await loader.load(metadata)
  }

  private path?: string | null = null
  private watcher: Watch.FSWatcher | null = null
  //private watchedFiles = Array<string>()

  private loadQueue = new PQueue({ concurrency: 1 })
  
  metadata: PluginMetadata | null = null
  plugin: Plugin | null = null
  pluginExport: PluginModuleExport | null = null
  pkg: IPackageJSON | null = null

  private constructor(
    public id: string
  ) {
    super()
    this.setMaxListeners(Number.MAX_SAFE_INTEGER)
  }

  private setMetadata(metadata: PluginMetadata) {
    const {path} = this.metadata = metadata
    Object.assign(
      this,
      metadata,
      {
        path: path.replace(/\@states\//,'')
      }
    )
  }

  private reset() {
    // if (this.watchedFiles.isEmpty()) {
    //   log.info(`Plugin ${this.id} clearing watched files and cache`)
    //   const files = [...this.watchedFiles]
    //   this.watchedFiles = []
    //
    //   files.forEach(file => {
    //     delete (NodeModule as any)._cache[file]
    //   })
    // }
    log.info("Cleaning Plugin Loader", this.id)
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
  
  /**
   * Add a file to be watched when it's loaded.  This is called by AppService.init
   * @param metadata
   */
  private async load(metadata: PluginMetadata): Promise<this> {
    //if (this.loadQueue.size) return this
    
    return await this.loadQueue.add(async () => {
      this.reset()
      this.setMetadata(metadata)

      const { path } = this
      assert(
        !!path,
        () => `Plugin path can not be null: ${JSON.stringify(metadata)}`
      )

      log.info(`Loading package info ${this.id}`)
      const pkgFile = Path.resolve(path, "package.json")
      assert(
        await fileExists(pkgFile),
        () => `Plugin ${this.id} package.json does not exist: ${pkgFile}`
      )

      delete nodeRequire.cache[pkgFile]
      const
        pkg: IPackageJSON = (this.pkg = nodeRequire(pkgFile)),
        main = Path.resolve(path, pkg.main),
        pluginRequire = NodeModule.Module.createRequireFromPath(path) as NodeRequire,
        mainFile = pluginRequire.resolve(main)//this.appRequire.resolve(main)
      
      assert(await fileExists(mainFile), () => `Main file does not exist ${mainFile}`)
  
      delete nodeRequire.cache[mainFile]
      const modExport = pluginRequire(mainFile),
        pluginExport: PluginModuleExport = (this.pluginExport =
          modExport.default || modExport)
  
      log.info(`Loaded package ${this.id}`)
      this.plugin = {
        pkg,
        name: pkg.name || this.id,
        title: (pkg as any).title || pluginExport.title || pkg.name || this.id,
        ...metadata,
        ...pluginExport
      }

      return this
    })
  }
}

export default function loadPlugin(
  metadata: PluginModuleExport
): Promise<PluginLoader> {
  return PluginLoader.load(metadata)
}
