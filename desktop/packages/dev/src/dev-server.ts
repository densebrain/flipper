import "./dev-init"
import ConsoleStamp from "console-stamp"

import express from "express"
import * as http from "http"

import Morgan from "morgan"
import * as Path from "path"
import { oc } from "ts-optchain"
import { isString } from "typeguard"
import webpack from "webpack"
import hotMiddleware from "webpack-hot-middleware"
import {
  Deferred,
  DevIPC,
  DevPluginModule,
  getDevIPCServer
} from "@states/common"
import { appDir, packageDir } from "./dirs"
import { startElectron } from "./ElectronLauncher"
import { getLogger } from "@states/common"
import {addShutdownHook} from "./process"
import {compileBasePackages, PackageName} from "./package-compiler"
import {
  WebpackAssetInfo,
  WebpackOutputMap,
  WebpackStatsAsset
} from "@states/common"
import * as _ from "lodash"
import {attachProvidedPackagesAssembler} from "./provided-package-assembler"
import generateWebpackConfig from "./webpack/webpack.config"



const
  StatsErrorsAndWarnings = {
    errors: true,
    warnings: true
  },
  port = isString(process.env.PORT) ? parseInt(process.env.PORT, 10) : 1616,
  log = getLogger(__filename)

let ipcServer: DevIPC | null = null

ConsoleStamp(console, {
  pattern: "HH:MM:ss.l"
})

addShutdownHook(() => {
  if (ipcServer) {
    ipcServer.stop()
  }
})

const compiledPackages = {} as WebpackOutputMap

function makeDevPluginModule(id: string): DevPluginModule {
  return {
    id,
    name: id,
    path: Path.resolve(packageDir, id)
  }
}

// ************************************
// This is the real meat of the example
// ************************************
export async function startDevServer() {
  
  // Start the Dev Server for firing updates to app
  ipcServer = await getDevIPCServer()
  
  // Add server event/request listeners
  ipcServer.on("getPlugins", (_ipc, _type, _msg) => {
    ipcServer.emit<"getPlugins">("getPlugins", {
      plugins: Object.keys(compiledPackages)
        .filter(name => isString(name) && name.startsWith("plugin-"))
        .map(name => makeDevPluginModule(name))
    })
  })
  
  // Package change listeners
  const
    changeEmitters: {[name: string]: (name: string) => void} = {},
    fireChanged = (name: string) => {
      const emitter = changeEmitters[name] = changeEmitters[name] ||
        _.debounce((name: string) => {
          if (name === "app") {
            log.info("Main process updated bundle")
            updateElectron()
          } else if (name.startsWith("plugin-")) {
            if (ipcServer) {
              const id = `@states/${name}`
              ipcServer.emit("pluginUpdated", {
                plugin: makeDevPluginModule(id)
              })
            }
          }
        }, 500)
      emitter(name)
    }
  
  const
    devServer = express(),
    webpackConfig = await generateWebpackConfig("development",port),
    multiCompiler = webpack(webpackConfig),
    { compilers } = multiCompiler,
    requiredPackages: Array<PackageName> = ["core", "app"],
    isReady = () =>
      requiredPackages.every(name => oc(compiledPackages[name]).length(0) > 0),
    readyDeferred = new Deferred<void>()

  compilers.forEach(compiler => {
    const { name } = compiler

    compiler.hooks.done.tap(
      `states-watcher-${name}`,
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
            } else {
              fireChanged(name)
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

  log.info(`All required packages are ready`, Object.keys(compiledPackages))

  devServer.use(Morgan("short"))

  // Step 3: Attach the hot middleware to the compiler & the server
  devServer.use(
    hotMiddleware(multiCompiler, {
      log: console.log,
      path: "/__webpack_hmr",
      heartbeat: 10 * 1000
    })
  )

  devServer.get("/", (_req, res) => {
    res.sendFile(appDir + "/index.html")
  })

  await new Promise(resolve => {
    const server = http.createServer(devServer)
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
  log.info("Attaching provided package compiler")
  attachProvidedPackagesAssembler()
  
  log.info("Compiling base packages")
  
  compileBasePackages()
    .then(() => {
      log.info("Compiled core, Starting dev server")
      startDevServer()
        .then(() => {
          started = true
          updateElectron()
        })
        .catch(err => log.error("Unable to start dev server", err))
    })
}

// Do anything you like with the rest of your express application.

export {}
