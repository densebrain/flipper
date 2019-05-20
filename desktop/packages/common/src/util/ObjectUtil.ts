import {getValue, isFunction, isNil, isObject, isString} from "typeguard"
import {getLogger} from "../logging/Logger"
import * as _ from 'lodash'



const
  log = getLogger(__filename)

export function clearArray<T>(arr:Array<T>):Array<T> {
  return arr.splice(0,arr.length)
}


export function safePush<T>(arr:Array<T>,value:T):Array<T> {
  return (arr || [])
    .filter(it => it !== value)
    .concat([value])
}





export function hasOwnProps(o:any,...props:string[]):boolean {
  return o && props.every(prop => o.hasOwnProperty(prop))
}


/**
 * Object cloning wrapper with some special extras
 * - copies typestore $$docs value
 * - copies explicit ids
 *
 * @param o
 * @param newSources
 * @returns {any}
 */
export function cloneObject<T>(o:T,...newSources:any[]):T {
  if (!o)
    return o
  
  const
    cloned = _.cloneDeep(o),
    
    /**
     * After clone - copy special props, etc
     *
     * @param it
     * @param index
     */
    afterObjectClone = (it:any,index: number = -1):void => {
      const
        base:any = index === -1 ? o : (o as any)[index]
      
      if (base && isObject(it)) {
        if (base.id)
          it.id = base.id
        
        if (base.$$doc)
          it.$$doc = cloneObjectShallow(base.$$doc)
        
        Object.assign(it,...newSources)
      }
    }
  
  if (cloned) {
    
    // ARRAY CLONED
    if (Array.isArray(cloned))
      cloned.forEach((it,index) =>
        afterObjectClone(it,index)
      )
    
    
    // SINGLE OBJECT CLONED
    else if (isObject(cloned)) {
      afterObjectClone(cloned)
    }
    
  }
  
  return cloned
  
}

/**
 * Shallow clone object and assign properties
 *
 * @param o
 * @param newSources
 */
export function cloneObjectShallow<T extends object>(o:T,...newSources:Array<Partial<T>>):T {
  return o ? Object.assign(_.clone(o),...newSources) : null
}

/**
 * Shallow equal an array or list
 *
 * @param val1
 * @param val2
 * @param props
 * @returns {boolean}
 */
export function shallowEqualsArrayOrList(val1: any,val2: any,...props:string[]):boolean {
  
  if (!val1 || !val2)
    return false
  
  const
    isArray = (Array.isArray(val1) && Array.isArray(val2) && val1.length === val2.length)
  
  
  return (isArray) && val1.every((testVal1:any,index:number) =>  {
    const
      testVal2 = (isArray ? val2[index] : val2.get(index))
    
    return (!props.length) ? testVal1 === testVal2 : shallowEquals(testVal1,testVal2,...props)
  })
}

/**
 * Shallow equal a specific property key for two objects
 *
 * @param o1
 * @param o2
 * @param key
 * @returns {boolean}
 */
export function shallowEqualsProp(o1: any,o2: any,key: string | null | symbol | number):boolean {
  if (!isString(key)) return false
  
  const
    val1 = _.get(o1,key),
    val2 = _.get(o2,key)
  
  return val1 === val2 ||
    shallowEqualsArrayOrList(val1,val2)
}

/**
 * Shallow equals two objects on either all own properties - OR - specific props provided
 *
 * @param o1
 * @param o2
 * @param props
 * @returns {any}
 */
export function shallowEquals(o1: any,o2: any,...props:string[]):boolean {
  if (o1 === o2)
    return true
  
  const
    o1Props = o1 && Object.keys(o1),
    o2Props = o2 && Object.keys(o2)
  
  
  
  return (o1Props && o2Props &&
    (props.length || o1Props.length === o2Props.length) &&
    ((props.length ? props : o1Props)
      .every(key => shallowEqualsProp(o1,o2,key))))
}

/**
 * Decoration wrapper
 *
 * @param name
 * @param clazz
 * @param decorator
 * @param data
 * @returns {any}
 */
export function postConstructorDecorate<T>(name:string, clazz:{new():T}, decorator:(instance:T,args:any[],data:any) => T,data:any = null):T {
  const makeDecorator =  new Function('name','clazz','decorator','data',`
		function ${name}() {
			clazz.apply(this,arguments);
			decorator(this,arguments,data);
		}
		
		${name}.prototype = clazz.prototype;
		return ${name};
	`)
  
  return makeDecorator(name,clazz,decorator,data)
}



export interface IValueTransformer {
  (key:string,val:any):any
}

export function transformValues(o: any,fn:IValueTransformer):any {
  return (Array.isArray(o)) ?
    o.map(aVal => transformValues(aVal,fn)) :
    (typeof o === "object") ?
      Object
        .keys(o)
        .reduce((newObj:any,nextKey:any) => {
          newObj[nextKey] = fn(nextKey,o[nextKey])
          return newObj
        },{}) :
      o
  
}

export function extractError(error:Error):Error | null {
  let newError:Error = null
  if (error) {
    newError = _.cloneDeep(_.pick(error, ['message', 'statusCode', 'errors'])) as Error
    if (!newError.message)
      newError.message = error.message || error.toString() || 'Save failed'
  }
  return newError
}

export type EnumValueMap<T, V extends keyof T = keyof T> = {[key in keyof T]:V}

export function convertEnumValuesToString<T>(enumClazz:T):EnumValueMap<T> {
  return Object.keys(enumClazz)
               .filter(isString)
               .reduce((valueMap,key) => {
                 (valueMap as any)[key] = key
                 return valueMap
               },{} as EnumValueMap<T>)
}

export function isEmpty(o:any):boolean {
  return isNil(o) || getValue(() => o.length, 0) < 1
}

//export type Asserter = ((() => boolean) | boolean)
export function assert(test:((() => boolean) | boolean),msg?:null | (() => string) | string | undefined):void {
  
  let result:boolean = false
  try {
    result = typeof test === 'boolean' ? test : test()
  } catch (err) {
    log.error(`Assert failed: "${test}"`,err)
  }
  
  if (!result) throw Error(!msg ? "No message" : isFunction(msg) ? msg() : msg)
}


export function toDashCase(str:string):string {
  return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
}
