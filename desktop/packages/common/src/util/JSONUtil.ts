
export function toJSON(value: any) {
  return JSON.stringify(value,null, 2)
}

export function fromJSON<T = any>(json: string):T {
  return JSON.parse(json) as T
}
