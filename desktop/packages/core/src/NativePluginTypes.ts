import {Plugin} from "./PluginTypes"
import createTableNativePlugin from "./TableNativePlugin"

export type KnownNativePlugin = "Table"

export type NativePluginProps<ExtraProps = any> = {
  id: string
  name?: string | null | undefined
  title: string
} & ExtraProps

export type NativePluginFactory<ExtraProps = any> = (props: NativePluginProps<ExtraProps>) => Plugin

export type NativePluginMap = {[key in KnownNativePlugin]: NativePluginFactory }

export const NativePluginFactories:NativePluginMap = {
  "Table": props => createTableNativePlugin(props)
}
