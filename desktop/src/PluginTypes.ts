
import React from "react"
import BaseDevice from "./devices/BaseDevice"
import Client from "./Client"
import {Logger} from "./fb-interfaces/Logger"
import {Theme} from "./ui/themes"
import AndroidDevice from "./devices/AndroidDevice"
import IOSDevice from "./devices/IOSDevice"
import {IBugs, IPackageJSON} from "package-json"
import {getValue} from "typeguard"
import {KeyboardActionHandler, KeyboardActions} from "./KeyboardTypes"

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
  message: string | Node,
  severity: "warning" | "error",
  timestamp?: number,
  category?: string,
  action?: string
}

export type PluginTarget = BaseDevice | Client

export type PluginBugContact = IBugs

export type PluginComponentProps<PersistedState, ExtraProps = {}> = {
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
  deepLinkPayload: string | null
  selectPlugin: (pluginID: string, deepLinkPayload: string | null) => boolean
  isArchivedDevice: boolean
  ref?:React.Ref<any> | React.RefObject<any> | undefined
} & ExtraProps

export interface PluginComponent<State = any, PersistedState = any, ExtraProps = any> extends React.Component<
  PluginComponentProps<PersistedState, ExtraProps>,
  State
  > {
  init?: () => void | null
  teardown?: () => void | null
  onKeyboardAction?: KeyboardActionHandler
}

export interface PluginComponentClass<State = any, PersistedState = any, ExtraProps = any>
  extends React.ComponentClass<
    PluginComponentProps<PersistedState, ExtraProps>,
    State
  > {
  new(props: PluginComponentProps<PersistedState, ExtraProps>, context?: any): PluginComponent<State,PersistedState, ExtraProps>
  
  keyboardActions?: KeyboardActions | null | undefined
  defaultPersistedState?: PersistedState
  
  
  persistedStateReducer?: (
    persistedState: PersistedState,
    method: string,
    data: Object
  ) => Partial<PersistedState>
}

export enum PluginType {
  Normal,
  Device
}

export interface Plugin<State = any, PersistedState = any, ExtraProps = any> {
  id: string
  type: PluginType
  pkg: IPackageJSON
  pluginPath?: string | null
  name: string
  title: string
  entry?: string  | null | undefined
  icon?: string  | null | undefined
  gatekeeper?: string  | null | undefined
  error?: string
  bugs?: PluginBugContact  | null | undefined
  componentClazz: PluginComponentClass<State, PersistedState, ExtraProps>
  component?: PluginComponent<State, PersistedState, ExtraProps> | null | undefined
}

export type PluginProp = keyof Plugin

export type PluginProps = { [key in PluginProp]: Plugin[key] }

export const PluginPropNamesRequired = Array<PluginProp>("id", "title", "entry", "component")
export const PluginPropNamesCopied = Array<PluginProp>("id", "name", "title", "entry", "icon", "gatekeeper", "bugs")


export interface DevicePlugin<State = any, PersistedState = any, ExtraProps = any> extends Plugin<State, PersistedState, ExtraProps> {

}

export interface DevicePluginComponent<State = any, PersistedState = any, ExtraProps = any> extends PluginComponent<State, PersistedState, ExtraProps> {
  getDevice(): BaseDevice | null
  getAndroidDevice(): AndroidDevice | null
  getIOSDevice(): IOSDevice | null
}

export function isPlugin(o: any): o is Plugin {
  return PluginPropNamesRequired.every(prop => !!o[prop]) &&
    getValue(() => !!o.id && !!o.componentClazz, false)
}

export function isDevicePlugin(o: any): o is DevicePlugin {
  return isPlugin(o) && o.type === PluginType.Device
}
