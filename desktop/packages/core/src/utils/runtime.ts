
export function Run<T>(fn:() => T): T {
  return fn()
}
