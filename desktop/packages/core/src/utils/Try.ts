import {isPromise} from "typeguard"
//import {Failure, Success, TFailure, TSuccess} from "funfix"


export class TryValue<T> {
  
  protected value: T
  protected constructor(value: T) {
    this.value = value
  }
  
  private checkFailure(): boolean {
    return this instanceof Failure
  }
  
  isFailure(): this is Failure<T> {
    return this.checkFailure()
  }
  
  isSuccess(): this is Success<T> {
    return this instanceof Success
  }
  
  getOrElse<E>(value: E): T | E {
    return this.checkFailure() ? value : this.value
  }
  
  getOrCall<E>(fn: () => E): T | E {
    return this.checkFailure() ? fn() : this.value
  }
  
  
}

export class Success<T> extends TryValue<T> {
  
  constructor(value: T) {
    super(value)
  }
}

export class Failure<T = any> extends TryValue<T> {
  
  constructor(value: T) {
    super(value)
  }
  
}

export type Try<T> = Success<T> | Failure<T>

export type TryResult<R> = R extends Promise<infer RT> ? Promise<Try<RT>> : Try<R>

export type TryCatchReturnType<R = any> = R extends Promise<infer RT> ? (Promise<RT> | RT) :  (Promise<R> | R)

function makeResult<R = any>(value: R): TryResult<R> {
  return (value instanceof Error ? new Failure(value) : new Success(value)) as any
}
function Try<
  R = any,
  RC = any,
  FnExec extends () => R = any,
  FnCatch extends ((err: Error) => R | RC) | undefined = any
>(fnExec: FnExec, fnCatch?: FnCatch | undefined): TryResult<R | RC> {
  const handleError = (err:Error) => {
    const catchResult = fnCatch(err)
    if (isPromise(catchResult)) {
      return catchResult
        .then(rCatch => {
          if (rCatch instanceof Error)
            throw rCatch
        
          return makeResult(rCatch)
        }) as TryResult<R>
    } else {
      if (catchResult instanceof Error)
        throw catchResult
    
      return makeResult(catchResult) as TryResult<R>
    }
  }
  
  let result: R
  try {
    result = fnExec()
  } catch (err) {
    return handleError(err)
  }
  
  return (isPromise(result) ?
    result.then(value => makeResult(value)).catch(handleError) :
    makeResult(result)) as TryResult<R>
}

export default Try
