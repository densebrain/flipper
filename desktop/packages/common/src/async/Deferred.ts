import {isDefined} from "typeguard"

interface DeferredState<T> {
  resolve: (result?:T) => void
  reject: (err:any) => void
  isSettled: boolean
  isCancelled: boolean
  result:T
}

/**
 * A deferred promise that can be resolved or rejected
 * externally, ideal for functions like a promise timeout
 */
export class Deferred<T> {
  
  static async delay(millis:number) {
    const deferred = new Deferred<void>()
    setTimeout(() => deferred.resolve(),millis)
    await deferred.promise
  }
  
  private state:DeferredState<T> = {
    resolve: null,
    reject: null,
    isSettled: false,
    isCancelled: false,
    result: null
  }
  
  readonly promise:Promise<T> = new Promise<T>((resolve, reject) =>
    Object.assign(this.state, {
      resolve,
      reject
    })
  )

  
  constructor(promise?:Promise<T>) {
    if (isDefined(promise)) {
      promise
        .then(this.state.resolve)
        .catch(this.state.reject)
    }
  }
  
  
  isSettled() {
    return this.state.isSettled
  }
  
  isCancelled() {
    return this.state.isCancelled
  }
  
  cancel() {
    this.state.isSettled = true
    this.state.isCancelled = true
  }
  
  resolve(result?:T) {
    if (!this.state.isSettled && !this.state.isCancelled) {
      this.state.isSettled = true
      this.state.resolve(result)
    }
  }
  
  reject(err:any) {
    if (!this.state.isSettled && !this.state.isCancelled) {
      this.state.isSettled = true
      this.state.reject(err)
    }
  }
}

export default Deferred
