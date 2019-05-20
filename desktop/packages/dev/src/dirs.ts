import * as Path from "path"

const
  rootDir = Path.resolve(__dirname, '..', '..', '..'),
  packageDir = Path.resolve(rootDir, 'packages'),
  coreDir = Path.resolve(packageDir, 'core'),
  appDir = Path.resolve(packageDir, 'app')

export {
  rootDir,
  packageDir,
  coreDir,
  appDir
}
