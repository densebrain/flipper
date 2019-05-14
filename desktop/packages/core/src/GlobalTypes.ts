import {Store} from "./reducers"

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__:any
    electronRequire: NodeRequire
    flipperStore: Store
  }
  
  namespace NodeJS {
    interface Global {
      electronRequire: NodeRequire
      flipperStore: Store
      __VERSION__:string
      __REVISION__:string | undefined
    }
  }
  
  type Omit<T, K extends keyof any> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;
  type FilterTypes<T, U> = T extends U ? T : never;
  
}

export {

}
