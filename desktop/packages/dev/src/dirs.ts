import * as Fs from "fs"
import * as Path from "path"

export type PluginConfig = {
  name: string
  dir: string
}

const
  rootDir = Path.resolve(__dirname, '..', '..', '..'),
  packageDir = Path.resolve(rootDir, 'packages'),
  coreDir = Path.resolve(packageDir, 'core'),
  appDir = Path.resolve(packageDir, 'app'),
  commonDir = Path.resolve(packageDir, 'common'),
  pluginDirs = Fs.readdirSync(packageDir)
    .filter(name => name.startsWith("plugin-"))
    .map(dir => Path.resolve(packageDir, dir)),
  pluginNames = pluginDirs.map(dir => Path.basename(dir)),
  // Build the plugin name map
  pluginNameMap = pluginDirs
  .reduce(
    (acc, dir) => {
      const name = Path.basename(dir)
      acc[name] = {
        name,
        dir
      }
      return acc
    },
    {} as { [key: string]: PluginConfig }
  )


export {
  rootDir,
  packageDir,
  coreDir,
  commonDir,
  appDir,
  pluginDirs,
  pluginNames,
  pluginNameMap
}
