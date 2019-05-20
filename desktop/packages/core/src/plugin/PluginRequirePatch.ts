import {Deferred, getLogger, PluginModuleWhitelistRefs} from "@flipper/common"

type LoaderMap = { [id: string]: () => any }

const
  NodeModule = nodeRequire("module") as typeof NodeJS.Module,
  defaultRequire = NodeModule.prototype.require,
  customLoaders = {
    "@flipper/common": () => require("@flipper/common"),
    "@flipper/core": () => require("../index"),
    "@flipper/sdk": () => require("../index")
  } as LoaderMap,
  log = getLogger(__filename)

let patchDeferred: Deferred<void> | null = null

export default async function patchRequire() {
  if (patchDeferred) return await patchDeferred.promise
  
  patchDeferred = new Deferred<void>()
  try {
    const
      webpackModules:any = __webpack_modules__,
      refs = await PluginModuleWhitelistRefs() as any
    
    NodeModule.prototype.require = function(id: string): any {
      log.info(`require(${id})`)
      if (refs[id]) {
        return refs[id]
      } else if (webpackModules[id]) {
        return __webpack_require__(id)
      } else if (customLoaders[id]) {
        return customLoaders[id]()
      }
  
      return defaultRequire.apply(this, [id])
    }
    
    patchDeferred.resolve()
  } catch (err) {
    log.error("Unable to patch require", err)
    patchDeferred.reject(err)
    patchDeferred = null
  }
}
