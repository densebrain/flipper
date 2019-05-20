export function nameFunction<F extends Function>(name: string, body: F): F {
  return {[name](...args:any[]) {return body(...args)}}[name] as any
}
