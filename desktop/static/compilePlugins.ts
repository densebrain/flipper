/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 * @flow strict-local
 */
import * as Path from "path"

import * as Fs from "fs"

import * as Util from "util"

import recursiveReaddir from "recursive-readdir"

import expandTilde from "expand-tilde"

import * as Os from 'os'

const Metro = require("metro")

const HOME_DIR = Os.homedir()

/* eslint-disable prettier/prettier */

/*::
type CompileOptions = {|
  force: boolean,
  failSilently: boolean,
|};
*/

const DEFAULT_COMPILE_OPTIONS =
  /*: CompileOptions */
  {
    force: false,
    failSilently: true
  }

export default async function (reloadCallback:any, pluginPaths:any, pluginCache:any, options = DEFAULT_COMPILE_OPTIONS) {
  const plugins = pluginEntryPoints(pluginPaths)

  if (!Fs.existsSync(pluginCache)) {
    Fs.mkdirSync(pluginCache)
  }

  watchChanges(plugins, reloadCallback, pluginCache, options)
  const dynamicPlugins = []

  for (let plugin of Object.values(plugins) as any[]) {
    const dynamicOptions = Object.assign(options, {
      force: false
    })
    const compiledPlugin = await compilePlugin(plugin, pluginCache, dynamicOptions)

    if (compiledPlugin) {
      dynamicPlugins.push(compiledPlugin)
    }
  }

  console.log("✅  Compiled all plugins.")
  return dynamicPlugins
}

function watchChanges(plugins:any, reloadCallback:any, pluginCache:any, options:any = DEFAULT_COMPILE_OPTIONS) {
  // eslint-disable-next-line no-console
  console.log("🕵️‍  Watching for plugin changes")
  Object.values(plugins).map((plugin: any) =>
    Fs.watch(
      plugin.rootDir,
      {
        recursive: true
      },
      (_eventType:any, filename) => {
        // only recompile for changes in not hidden files. Watchman might create
        // a file called .watchman-cookie
        if (!filename.startsWith(".")) {
          // eslint-disable-next-line no-console
          console.log(`🕵️‍  Detected changes in ${plugin.name}`)
          const watchOptions = Object.assign(options, {
            force: true
          })
          compilePlugin(plugin, pluginCache, watchOptions).then(reloadCallback)
        }
      }
    )
  )
}

function hash(str:string) {
  let hash = 0

  if (str.length === 0) {
    return hash
  }

  let chr

  for (let i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }

  return hash
}

const fileToIdMap = new Map()

const createModuleIdFactory = () => (filePath: string) => {
  if (filePath === "__prelude__") {
    return 0
  }

  let id = fileToIdMap.get(filePath)

  if (typeof id !== "number") {
    id = hash(filePath)
    fileToIdMap.set(filePath, id)
  }

  return id
}

function pluginEntryPoints(additionalPaths:string[] = []) {
  const defaultPluginPath = Path.join(HOME_DIR, ".flipper", "node_modules")
  const entryPoints = entryPointForPluginFolder(defaultPluginPath)

  if (typeof additionalPaths === "string") {
    additionalPaths = [additionalPaths]
  }

  additionalPaths.forEach(additionalPath => {
    const additionalPlugins = entryPointForPluginFolder(additionalPath)
    Object.keys(additionalPlugins).forEach(key => {
      entryPoints[key] = additionalPlugins[key]
    })
  })
  return entryPoints
}

function entryPointForPluginFolder(pluginPath: string): any {
  pluginPath = expandTilde(pluginPath)

  if (!Fs.existsSync(pluginPath)) {
    return {}
  }

  return Fs
    .readdirSync(pluginPath)
    .filter(name =>
      /*name.startsWith('flipper-plugin') && */
      Fs.lstatSync(Path.join(pluginPath, name)).isDirectory()
    )
    .filter(Boolean)
    .map(name => {
      let packageJSON

      try {
        packageJSON = Fs.readFileSync(Path.join(pluginPath, name, "package.json")).toString()
      } catch (e) {}

      if (packageJSON) {
        try {
          const pkg = JSON.parse(packageJSON)
          return {
            packageJSON: pkg,
            name: pkg.name,
            entry: Path.join(pluginPath, name, pkg.main || "index.js"),
            rootDir: Path.join(pluginPath, name)
          }
        } catch (e) {
          console.error(`Could not load plugin "${pluginPath}", because package.json is invalid.`)
          console.error(e)
          return null
        }
      }
    })
    .filter(Boolean)
    .reduce((acc, cv) => {
      acc[cv.name] = cv
      return acc
    }, {} as any)
}

function mostRecentlyChanged(dir: string) {
  return Util
    .promisify(recursiveReaddir)(dir)
    .then((files: Array<string>) => files.map((f:string) => Fs.lstatSync(f).ctime).reduce((a:Date, b:Date) => (a > b ? a : b), new Date(0)))
}

async function compilePlugin(
  { rootDir, name, entry, packageJSON }: any,
  pluginCache: any,
  options: any
  /*: CompileOptions */
) {
  const fileName = `${name}@${packageJSON.version || "0.0.0"}.js`
  const out = Path.join(pluginCache, fileName)
  const result = Object.assign({}, packageJSON, {
    rootDir,
    name,
    entry,
    out
  }) // check if plugin needs to be compiled

  const rootDirCtime = await mostRecentlyChanged(rootDir)

  if (!options.force && Fs.existsSync(out) && rootDirCtime < Fs.lstatSync(out).ctime) {
    // eslint-disable-next-line no-console
    console.log(`🥫  Using cached version of ${name}...`)
    return result
  } else {
    console.log(`⚙️  Compiling ${name}...`) // eslint-disable-line no-console

    try {
      await Metro.runBuild(
        {
          reporter: {
            update: () => {}
          },
          projectRoot: rootDir,
          watchFolders: [__dirname, rootDir],
          serializer: {
            getRunModuleStatement: (moduleID: any) => `module.exports = global.__r(${moduleID}).default;`,
            createModuleIdFactory
          },
          transformer: {
            babelTransformerPath: Path.join(__dirname, "transforms", "index.js")
          },
          resolver: {
            blacklistRE: /\/(sonar|flipper-public)\/dist\//
          }
        },
        {
          entry: entry.replace(rootDir, "."),
          out,
          dev: false,
          sourceMap: true,
          minify: false
        }
      )
    } catch (e) {
      if (options.failSilently) {
        console.error(`❌  Plugin ${name} is ignored, because it could not be compiled.`)
        console.error(e)
        return null
      } else {
        throw e
      }
    }

    return result
  }
}
