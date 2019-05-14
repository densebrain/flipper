/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

export type FilterType = "include" | "exclude" | "enum"
export type PersistentFilterType = FilterTypes<"enum", FilterType>
export type Filter<Type extends FilterType = FilterType> = {
  key:string
  type:Type
  invertible?: boolean | undefined
} & (Type extends "include" | "exclude" ?
  {
    value:string
    
  }
  : Type extends "enum" ? {
    value:Array<string>,
    enum:Array<{
      label:string,
      color?:string,
      value:string
    }>,
    persistent?:boolean
  } : never)


export function isFilterPersistent(filter:Filter):filter is Filter<PersistentFilterType> {
  return filter.type === "enum"
}

export function isFilterType<Type extends FilterType>(o: any, type: Type): o is Filter<Type> {
  return o.type === type
}

