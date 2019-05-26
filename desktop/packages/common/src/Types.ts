
import * as _ from 'lodash'

export type StringMap<V> = { [key:string]:V }

export type StringOrNumber = string | number

export type Pair<T1, T2> = [T1, T2]

export type FunctionOrValue<T> = (() => T) | T | null

//export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>



export interface IDataSet<T> {
	data:Array<T>
	total:number
	ready:boolean
	loadedRange:Pair<number, number>
	loading:boolean
	idProperty:keyof T
}

export function makeDataSet<T>(
	data:Array<T> = Array<T>(),
	total:number = data.length,
	loadedStart:number = 0,
	loadedEnd:number = total,
	idProperty:keyof T = "id" as any
):IDataSet<T> {
	return {
		data,
		total,
		ready: total > -1,
		loadedRange: [loadedStart, loadedEnd],
		loading: false,
		idProperty
	}
}

export function updateDataSet<T = any>(newData:Array<T>, oldDataSet:IDataSet<T> | null):IDataSet<T> {
	const	newDataSet = makeDataSet(newData)
	if (!oldDataSet)
		return newDataSet
	else if (_.isEqual(oldDataSet, newDataSet))
		return oldDataSet

	if (_.isEqual(newDataSet.data, oldDataSet.data)) {
		return Object.assign(newDataSet,{data: oldDataSet.data})
	}

  oldDataSet.data.forEach(oldObj => {
  	const
			oldId = oldObj[oldDataSet.idProperty],
			newObjIndex = newData.findIndex(newObj => newObj[newDataSet.idProperty] === oldId)

		if (newObjIndex > -1 && _.isEqual(newData[newObjIndex], oldObj)) {
			newDataSet.data[newObjIndex] = oldObj
		}
	})

	return newDataSet
}

export type PromiseResolver<T = any,TResult1 = T> = ((value: T) => TResult1 | PromiseLike<TResult1>)

export type StatesConfig = {
	pluginPaths: Array<string>
	disabledPlugins: Array<string>
	lastWindowPosition?: any
	updaterEnabled?: boolean | undefined
	launcherMsg?: string | undefined
}

export const NotificationEvents = ["show", "click", "close", "reply", "action"]
export type NotificationEvent = typeof NotificationEvents[number]

import {IPackageJSON} from "package-json"

if (typeof isDev === 'undefined') {
	Object.assign(global, {
		isDev: false
	})
}




declare global {
	const isDev: boolean
	
	namespace NodeJS {
		interface Global {
			isDev:boolean
		}
	}
	//type Omit<T, K extends keyof any> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;
	type FilterTypes<T, U> = T extends U ? T : never;
	
	type Primitive = string | number | boolean | undefined | null;
	
	type Unwrap<T> =
		T extends Promise<infer U> ? UnwrapSimple<U> :
			UnwrapSimple<T>;
	
	type UnwrapSimple<T> =
		T extends Array<infer U> ? UnwrappedArray<U> :
		T
		
	interface UnwrappedArray<T> extends Array<Unwrap<T>> {}
	
	type PluginPackage = IPackageJSON & {
		rootDir: string
		name: string
		entry?: string
		out: string
	}
	
}


