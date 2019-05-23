
export function Identity<T>(t: T):T {
  return t
}

export type Identity<T> = (t:T) => T



export const NOOP = Identity
