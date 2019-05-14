/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

export type PluginState<State = any> = State

export type PluginStatesState = {
  [pluginKey:string]:PluginState
}
export const pluginKey = (serial:string, pluginName:string):string => {
  return `${serial}#${pluginName}`
}


export type ActionPayload<Type extends ActionType = any> = Type extends 'SET_PLUGIN_STATE' ? {
  pluginKey:string,
  state:PluginState
} : Type extends "CLEAR_PLUGIN_STATE" ?
  {
    id:string,
    devicePlugins:Set<string>
  } : never


export type ActionType = 'SET_PLUGIN_STATE' | 'CLEAR_PLUGIN_STATE' // extends string ? K : never

export type Action<Type extends ActionType = any, Payload extends ActionPayload<Type> = any> = Type extends ActionType ? {
  type:Type,
  payload:Payload
} : never

//export type Actions
// | {
//     type: "SET_PLUGIN_STATE",
//     payload:
//   }
// | {
//     type: "CLEAR_PLUGIN_STATE",
//     payload:
//   }
const INITIAL_STATE:PluginStatesState = {}


//type ActionTypes<A extends ActionConfig = Action> = A["type"]

//type ActionPayload<ActionType extends ActionTypes, A extends Action = {type: ActionType} & any> = A["payload"]
// type LookupMap<K extends string, M extends {[key in K]: V}, V extends any = any> = {[key in K]: M[K]}
// type ActionHandler<Type extends ActionType = any> = ((pluginStatesState:PluginStatesState, payload:ActionPayload<Type>) => PluginStatesState)
//LookupMap<ActionType,ActionPayload,ActionHandler>
const ActionHandlers:   {
  [Type in ActionType]:((pluginStatesState:PluginStatesState, payload:ActionPayload<Type>) => PluginStatesState)
}
= {
  SET_PLUGIN_STATE: (pluginStatesState, payload) => {
    const newPluginState = payload.state
  
    if (newPluginState && newPluginState !== pluginStatesState) {
      return {
        ...pluginStatesState,
        [payload.pluginKey]: {...pluginStatesState[payload.pluginKey], ...newPluginState}
      }
    }
  
    return {...pluginStatesState}
  },
  CLEAR_PLUGIN_STATE: (pluginStatesState, payload) => {
  
    return Object.keys(pluginStatesState).reduce((newState, pluginKey) => {
      // Only add the pluginState, if its from a plugin other than the one that
      // was removed. pluginKeys are in the form of ${clientID}#${pluginID}.
      const pluginId = pluginKey.split("#").pop()
    
      if (pluginId !== payload.id || payload.devicePlugins.has(pluginId)) {
        newState[pluginKey] = pluginStatesState[pluginKey]
      }
    
      return newState
    }, {} as PluginStatesState)
  }
}

export default function reducer<Type extends ActionType = any>(pluginStatesState:PluginStatesState = INITIAL_STATE, action:Action<Type>):PluginStatesState {
  const handler = ActionHandlers[action.type]
  if (!handler) {
    return pluginStatesState
  } else {
    return handler(pluginStatesState, action.payload)
  }
}
export const setPluginState = (payload:{ pluginKey:string, state:Object }):Action => ({
  type: "SET_PLUGIN_STATE",
  payload
})
