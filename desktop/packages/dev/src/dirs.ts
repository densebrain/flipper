import * as Fs from "fs"
import * as Path from "path"

const
  rootDir = Path.resolve(__dirname, '..', '..', '..'),
  packageDir = Path.resolve(rootDir, 'packages'),
  coreDir = Path.resolve(packageDir, 'core'),
  appDir = Path.resolve(packageDir, 'app'),
  pluginDirs = Fs.readdirSync(packageDir)
    .filter(name => name.startsWith("plugin-"))
    .map(dir => Path.resolve(packageDir, dir)),
  pluginNames = pluginDirs.map(dir => Path.basename(dir))

export {
  rootDir,
  packageDir,
  coreDir,
  appDir,
  pluginDirs,
  pluginNames
}
