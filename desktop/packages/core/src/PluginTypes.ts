import * as React from "react"
import BaseDevice from "./devices/BaseDevice"
import Client from "./Client"
import {Logger} from "./fb-interfaces/Logger"
import {Theme} from "./ui/themes"
import AndroidDevice from "./devices/AndroidDevice"
import IOSDevice from "./devices/IOSDevice"
import {IBugs, IPackageJSON} from "package-json"
import {getValue, isString} from "typeguard"
import {KeyboardActionHandler, KeyboardActions} from "./KeyboardTypes"
import {Store} from "./reducers"
import * as _ from 'lodash'
import Device from "./devices/BaseDevice"

export interface PluginClient {
  send<P = any>(method: string, params: P): void;
  call<T = any, P = any>(method: string, params?: P): Promise<T>;
  subscribe<P = any>(method: string, callback: (params: P) => void): void;
  unsubscribe<P = any>(method: string, callback: (params: P) => void): void;
  supportsMethod(method: string): Promise<boolean>;
}


export type Notification = {
  id: string,
  title: string,
  message: string | React.ReactNode | Node,
  severity: "warning" | "error",
  timestamp?: number,
  category?: string,
  action?: string
}

export type PluginTarget = BaseDevice | Client

export type PluginBugContact = IBugs


export interface PluginComponentProps<PersistedState> {
  id: string
  key?: string
  title: string
  icon?: string | null | undefined
  entry?: string | null | undefined
  gatekeeper?: string  | null | undefined
  bugs?: PluginBugContact  | null | undefined
  logger: Logger
  theme: Theme
  store: FlipperStore
  persistedState: PersistedState
  setPersistedState: (state: Partial<PersistedState>) => void
  target: PluginTarget
  deepLinkPayload?: string | null
  selectPlugin: (pluginID: string, deepLinkPayload: string | null) => boolean
  isArchivedDevice?: boolean
  ref?:React.Ref<any> | React.RefObject<any> | undefined
}// & ExtraProps


export type PluginActionType = string
export type PluginActionPayload<Type extends PluginActionType = any, OtherProps = any> = {
  type: Type
} & OtherProps

export type PluginActions<Type extends PluginActionType = any, Payload extends PluginActionPayload<Type> = any> = {
  [type in Type]: Payload[type]
}

export type PluginActionPayloadParam<Actions extends PluginActions<Type>, Type extends PluginActionType> =
  Actions[Type]

export interface PluginComponent<Props extends PluginComponentProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any> extends React.Component<
  Props,
  State
  > {
  readonly reducers?: PluginReducers<State,Actions>
  
  init?: () => void | null
  teardown?: () => void | null
  onKeyboardAction?: KeyboardActionHandler
  dispatchAction: <Type extends Actions["type"], Payload extends PluginActionPayloadParam<Actions, Type>>(type: Type, payload: Payload) => void
}

export type PluginReducers<State, Actions extends PluginActions, Type extends string = any> = {
  [actionName in Type]: (state: State, actionData: Actions[actionName]) => Partial<State>
}

export interface PluginComponentClass<Props extends PluginComponentProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any>
  extends React.ComponentClass<
    Props,
    State
  > {
  new(props: Props, context?: any): PluginComponent<Props, State,Actions, PersistedState>
  
  
  keyboardActions?: KeyboardActions | null | undefined
  defaultPersistedState?: PersistedState
  
  getActiveNotifications?: (persistedState: PersistedState) => Array<Notification>
  
  exportPersistedState?: (
    _callClient: (a: string, b?: Plugin | null) => Promise<PersistedState>,
    persistedState: PersistedState | null ,
    _store: Store | null
  ) => Promise<PersistedState | null>
  
  persistedStateReducer?: (
    persistedState: PersistedState,
    method: keyof Actions,
    payload: Actions[typeof method]
  ) => Partial<PersistedState>
  
  onRegisterDevice?: (
    store: Store,
    baseDevice: BaseDevice,
    setPersistedState: (pluginKey: string, newPluginState: PersistedState | null | undefined) => void
  ) => void
}

export interface DevicePluginComponentClass<Props extends PluginComponentProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any>
extends PluginComponentClass<Props,State, Actions, PersistedState> {
  new(props: Props, context?: any): DevicePluginComponent<Props, State,Actions, PersistedState>
  
  supportsDevice: (device: Device)=> boolean
}

export enum PluginType {
  Normal,
  Device
}

//export const PluginTypeNames = Object.values(PluginType).filter(isString)
export const PluginTypeValues = Object.values(PluginType).filter(isString)
export type PluginTypes = typeof PluginTypeValues[number]

export type PluginMetadata = {
  id: string
  name?: string
  path?: string
  pkg?: IPackageJSON
}

export interface PluginModuleExport<ComponentClazz extends PluginComponentClass<Props, State, Actions, PersistedState> = any, Props extends PluginComponentProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any, Type extends PluginType = PluginType.Normal> extends PluginMetadata {
  type: Type
  path?: string
  title?: string
  url?: string
  componentClazz: ComponentClazz
}


export interface Plugin<
  Props extends PluginComponentProps<PersistedState> = any,
  State = any,
  Actions extends PluginActions = any,
  PersistedState = any,
  ComponentClazz extends PluginComponentClass<Props, State, Actions, PersistedState> = PluginComponentClass<Props, State, Actions, PersistedState>,
  Type extends PluginType = any
> extends PluginModuleExport<ComponentClazz,Props,State, Actions, PersistedState, Type> {
  
  pluginPath?: string | null
  name: string
  title: string
  entry?: string  | null | undefined
  icon?: string  | null | undefined
  gatekeeper?: string  | null | undefined
  error?: string
  bugs?: PluginBugContact  | null | undefined
  component?: PluginComponent<Props, State, Actions, PersistedState> | null | undefined
}

export type PluginProp = keyof Plugin

export type PluginProps = { [key in PluginProp]: Plugin[key] }

export const PluginPropNamesRequired = Array<PluginProp>("id", "title", "componentClazz")
export const PluginPropNamesCopied = Array<PluginProp>("id", "name", "title", "entry", "icon", "gatekeeper", "bugs")


export interface DevicePlugin<Props extends PluginComponentProps<PersistedState> = any, Actions extends PluginActions = any, State = any, PersistedState = any> extends Plugin<Props, Actions, State, PersistedState, DevicePluginComponentClass<Props, Actions,State, PersistedState>, PluginType.Device> {


}

export interface DevicePluginComponent<Props extends PluginComponentProps<PersistedState> = any, State = any, Actions extends PluginActions = any, PersistedState = any>
  extends PluginComponent<Props, State, Actions, PersistedState> {
  getDevice(): BaseDevice | null
  getAndroidDevice(): AndroidDevice | null
  getIOSDevice(): IOSDevice | null
}

export function validatePlugin(plugin: Partial<Plugin>): boolean {
  return PluginPropNamesRequired.every(prop => !!plugin[prop]) &&
    getValue(() => !!plugin.id && !!plugin.componentClazz, false)
}

export function isPlugin(plugin: Partial<Plugin>): plugin is Plugin {
  return validatePlugin(plugin)
}

export function isDevicePlugin(o: any): o is DevicePlugin {
  return o.type === PluginType.Device && isPlugin(o)
}

export function callClient<T extends object = any>(client: Client, id: string): (a: string, b: Plugin | undefined) => Promise<T> {
  return (method, params) => client.call(id, method, false, params)
}

export type PluginError = [IPackageJSON, Plugin | null, Error | null, string]


export function makePlugin<Type extends PluginType>(componentClazz:PluginComponentClass, type: Type): typeof type extends PluginType.Device ? DevicePlugin : Plugin  {
  const props = _.pick(componentClazz, "id", "title", "name") as Pick<Plugin, "id" | "title" |"name">
  let {
    id,
    name,
    title
  } = props
  
  Object.assign(props, {
    name: name || id,
    title: title || name || id
  })
  
  return {
    ...props,
    type,
    componentClazz
  } as any
}


export function makeNormalPlugin(componentClazz:PluginComponentClass) {
  return makePlugin<PluginType.Normal>(componentClazz, PluginType.Normal)
}
export function makeDevicePlugin(componentClazz:DevicePluginComponentClass) {
  return makePlugin<PluginType.Device>(componentClazz, PluginType.Device)
}
