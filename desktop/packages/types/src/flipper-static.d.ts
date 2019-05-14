import {IPackageJSON} from "package-json"


export type PluginPackage = IPackageJSON & {
  rootDir: string
  name: string
  entry?: string
  out: string
}

