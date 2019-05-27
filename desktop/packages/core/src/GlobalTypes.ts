import "@stato/common"
import {Store} from "./reducers"

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__:any
    electronRequire: NodeRequire
   statoStore: Store
  }
  
  namespace NodeJS {
    interface Global {
      electronRequire: NodeRequire
     statoStore: Store
      __VERSION__:string
      __REVISION__:string | undefined
    }
  }
  
  const nodeRequire: NodeRequire
  
  namespace PQueue {
    interface DefaultAddOptions {
      priority?: number
      [key: string]: unknown
    }
  }
}

Object.assign(global, {
  nodeRequire: __non_webpack_require__
})

export {

}
