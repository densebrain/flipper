import "./dev-init"
import ConsoleStamp from "console-stamp"

import express from "express"
import * as http from "http"

import Morgan from "morgan"
import * as Path from "path"
//import {getValue} from "typeguard"
import { oc } from "ts-optchain"
import { isString } from "typeguard"
import webpack from "webpack"
//import devMiddleware from "webpack-dev-middleware"
import hotMiddleware from "webpack-hot-middleware"
import {
  Deferred,
  DevIPC,
  DevPluginModule,
  getDevIPCServer
} from "@flipper/common"
import { appDir, packageDir } from "./dirs"
import { startElectron } from "./ElectronLauncher"
import { getLogger } from "@flipper/common"
import { makeProjectCompiler, ProjectCompiler } from "./project-compiler"
import {
  WebpackAssetInfo,
  WebpackOutputMap,
  WebpackStatsAsset
} from "@flipper/common"
import * as _ from "lodash"
import generateWebpackConfig from "./webpack.config"

type PackageName = "init" | "common" | "core" | "types"

const StatsErrorsAndWarnings = { errors: true, warnings: true },
  port = isString(process.env.PORT) ? parseInt(process.env.PORT, 10) : 1616,
  log = getLogger(__filename)

let ipcServer: DevIPC | null = null

ConsoleStamp(console, { pattern: "HH:MM:ss.l" })

const compilers: { [name in PackageName]: ProjectCompiler | null } = {
    types: null,
    init: null,
    common: null,
    core: null
  }

  //"SIGABRT","SIGQUIT", "SIGINT", "SIGKILL"
;["beforeExit", "exit"].forEach(event =>
  process.on(event as any, () => {
    if (ipcServer) {
      ipcServer.stop()
    }

    Object.entries(compilers).forEach(([name, compiler]) => {
      if (compiler) {
        compiler.kill()
        delete compilers[name as PackageName]
      }
    })
  })
)

const compiledPackages = {} as WebpackOutputMap

function makeDevPluginModule(id: string): DevPluginModule {
  return {
    id,
    name: id,
    path: Path.resolve(packageDir, id)
    //assets
  }
}

// ************************************
// This is the real meat of the example
// ************************************
export async function startDevServer() {
  ipcServer = await getDevIPCServer()
  ipcServer.on("getPlugins", (_ipc, _type, _msg) => {
    ipcServer.emit<"getPlugins">("getPlugins", {
      plugins: Object.keys(compiledPackages)
        .filter(name => isString(name) && name.startsWith("plugin-"))
        .map(name => makeDevPluginModule(name))
      //              .reduce((acc, [key,val]) => ({
      //   ...acc,
      //   [key]: val
      // }))
    })
  })
  const app = express(),
    webpackConfig = await generateWebpackConfig(port, "development"),
    multiCompiler = webpack(webpackConfig),
    { compilers } = multiCompiler,
    requiredPackages = ["core", "app"],
    isReady = () =>
      requiredPackages.every(name => oc(compiledPackages[name]).length(0) > 0),
    readyDeferred = new Deferred<void>()

  compilers.forEach(compiler => {
    const { name } = compiler

    compiler.hooks.done.tap(
      `flipper-watcher-${name}`,
      (stats: webpack.Stats) => {
        log.info(
          `>>> Compiled ${name}`,
          stats.toString({
            colors: true,
            assets: true,
            source: false,
            errors: true,

            // Add details to errors (like resolving log)
            errorDetails: true
          })
        )
      }
    )

    compiler.watch(
      {
        //poll: 1000
      },
      (err, stats) => {
        if (err) {
          log.error(`Unable to compile ${name}`, err)
        }
        if (stats.hasErrors() || stats.hasWarnings()) {
          log.error(
            `${stats.hasErrors() ? "Errors/" : ""}Warnings for ${name}`,
            stats.toString(StatsErrorsAndWarnings)
          )
        }

        if (!stats.hasErrors()) {
          const webpackChunks = _.flatten(
              stats.compilation.chunkGroups
                .filter(group => (group as any).isInitial())
                .map(
                  group =>
                    (group as any).chunks.filter(
                      (chunk: webpack.compilation.Chunk) => chunk.entryModule
                    ) as Array<webpack.compilation.Chunk>
                )
            ),
            webpackAssets = stats.compilation.assets,
            assets = Array<WebpackAssetInfo>()

          Object.entries(webpackAssets).forEach(
            ([assetName, _asset]: [string, WebpackStatsAsset]) => {
              assets.push({
                name: assetName,
                filename: Path.resolve(compiler.options.output.path, assetName)
                //asset
              })
            }
          )

          webpackChunks.forEach((chunk: webpack.compilation.Chunk) =>
            assets.push({
              name: chunk.name,
              initial: true,
              filename: Path.resolve(
                compiler.options.output.path,
                chunk.files[0]
              )
              //chunk
            })
          )

          compiledPackages[name] = assets

          if (isReady()) {
            if (!readyDeferred.isSettled()) {
              readyDeferred.resolve()
            } else if (name === "app") {
              log.info("Main process updated bundle")
              updateElectron()
            } else if (name.startsWith("plugin-")) {
              if (ipcServer) {
                const id = `@flipper/${name}`
                ipcServer.emit("pluginUpdated", {
                  plugin: makeDevPluginModule(id)
                })
              }
            }
          }
          log.info(
            `Assets for ${name}`,
            assets.map(({ filename }) => [filename])
          )
        }
      }
    )
  })

  log.info("Waiting for required packages...")
  await readyDeferred.promise

  log.info(`All required packages are ready`, compiledPackages)

  app.use(Morgan("short"))

  // Step 3: Attach the hot middleware to the compiler & the server
  app.use(
    hotMiddleware(multiCompiler, {
      log: console.log,
      path: "/__webpack_hmr",
      heartbeat: 10 * 1000
    })
  )

  app.get("/", (_req, res) => {
    res.sendFile(appDir + "/index.html")
  })

  await new Promise(resolve => {
    const server = http.createServer(app)
    server.listen(port, () => {
      log.info("Listening on %j", server.address())
      resolve()
    })
  })
}

let started = false

function updateElectron() {
  if (!started) return
  startElectron(compiledPackages)
}

if (require.main === module) {
  log.info("Compiling common")

  function compileCore() {
    compilers["core"] = makeProjectCompiler("core")
      .on("first_success", () => {
        log.info("Compiled core, Starting dev server")
        startDevServer()
          .then(() => {
            started = true
            updateElectron()
          })
          .catch(err => log.error("Unable to start dev server", err))
      })
      .on("subsequent_success", () => {
        log.info("Compiled core")
      })
      .on("compile_errors", () => {
        log.error("Compiled errors")
      })
      .start()
  }
  
  function compileTypes() {
    compilers["types"] = makeProjectCompiler("types")
      .on("first_success", () => {
        log.info("Compiled type")
        log.info("Compiling common")
        compileCommon()
      })
      .start()
  }
  
  function compileInit() {
    compilers["init"] = makeProjectCompiler("init")
      .on("first_success", () => {
        log.info("Compiled init")
        log.info("Compiling core")
        compileCore()
      })
      .start()
  }

  function compileCommon() {
    compilers["common"] = makeProjectCompiler("common")
      .on("first_success", () => {
        log.info("Compiled common")
        log.info("Compiling init")
        compileInit()
      })
      .start()
  }

  compileTypes()
}

// Do anything you like with the rest of your express application.

export {}
