/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { getLogger, Identity } from "@stato/common"
import * as Path from "path"
import { isDefined } from "typeguard"
import {
  coreDir,
  packageDir,
  appDir,
  rootDir,
  pluginNames,
  pluginNameMap,
  PluginConfig
} from "../dirs"
import webpack, { ExternalsElement } from "webpack"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"

import HtmlWebpackPlugin from "html-webpack-plugin"
import {
  makeCommonExternals,
  ReactExternals,
  WebpackHotWhitelist
} from "./webpack.config.externals"

import moduleConfig from "./webpack.config.module"
import IgnoreNotFoundExportPlugin from "./webpack.plugin.ignore-export"

type Mode = "development" | "production"

const log = getLogger(__filename),
  browserTarget = "node" // "electron-renderer"

let mode: Mode = "development"
let port: number | undefined = 3000

const devTools: { [mode in Mode]: webpack.Options.Devtool } = {
    development: "inline-source-map",
    production: "#source-map"
  },
  nodeConfig = {
    global: true,
    process: true,
    __filename: true
  },
  resolveConfig = {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "react-dom": "@hot-loader/react-dom",
      jss: Path.resolve(rootDir, "node_modules", "jss"),
      assets: Path.resolve(coreDir, "assets")
    }
  }

function getWhitelistIds() {
  return [
    "react",
    "react-dom",
    "react-hot-loader",
    "@hot-loader/react-dom",

    "@material-ui/styles/ThemeContext",
    "@material-ui/styles/withStyles",
    "@material-ui/styles",
    "@material-ui/core",
    "@material-ui/core/styles/colorManipulator",
    "@material-ui/styles/jssPreset",
    "@material-ui/utils",
    "jss"
  ]
}

function applyMode(
  name: string,
  config: webpack.Configuration
): webpack.Configuration {
  if (mode !== "development") return config

  const entry: Array<string> = Array.isArray(config.entry)
    ? (config.entry as any)
    : [config.entry]

  return {
    ...config,
    entry: [
      //reload=true
      `webpack-hot-middleware/client?name=${name}&path=${encodeURIComponent(
        `http://localhost:${port}/__webpack_hmr`
      )}&timeout=2000`,
      ...entry
    ],
    output: {
      ...config.output,
      publicPath: Path.resolve(packageDir, name, "dist") + Path.sep
    },
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve.alias || {})
        //'react-dom': '@hot-loader/react-dom'
      }
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), ...config.plugins]
  }
}

function makeDefaultConfig(
  name: string,
  context: string,
  entry: string[],
  target: "node" | "electron-renderer",
  externals: ExternalsElement | ExternalsElement[],
  plugins: webpack.Plugin[],
  customizer: (
    config: webpack.Configuration
  ) => webpack.Configuration | undefined = Identity
) {
  return customizer(
    applyMode(name, {
      name,
      mode,
      cache: true,
      context,
      entry,
      target,
      module: moduleConfig,
      resolve: resolveConfig,
      output: {
        libraryTarget: "commonjs2",
        path: Path.resolve(context, "dist"),
        publicPath: "./",
        filename: "bundle.js"
      },
      devtool: devTools[mode],
      externals,
      optimization: {
        namedModules: true,
        noEmitOnErrors: true
      },
      watchOptions: {
        ignored: [/node_modules.*(src|stato)/]
      },
      node: nodeConfig,

      plugins: [
        new webpack.DefinePlugin({
          "process.env.PluginModuleWhitelist": JSON.stringify(
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            getWhitelistIds()
          ),
          isDev: JSON.stringify(mode === "development"),
          ...(mode !== "production"
            ? {}
            : {
                "process.env.BundledPluginNames": JSON.stringify(pluginNames)
              })
        }),
        new IgnoreNotFoundExportPlugin(),
        new ForkTsCheckerPlugin(),
        ...plugins
      ]
    })
  )
}
/**
 * Create plugin config
 *
 *
 * @returns {Promise<webpack.Configuration>}
 * @param pluginConfig
 */
async function createPluginConfig(
  pluginConfig: PluginConfig
): Promise<webpack.Configuration> {
  const { name, dir } = pluginConfig,
    whitelistIds = getWhitelistIds()

  return makeDefaultConfig(
    name,
    dir,
    ["./src/index"],
    browserTarget,

    // Externals
    [
      (context, request, callback) => {
        if (request.includes("plugin-")) {
          log.debug("Stato plugin request, ignoring", request, context)
        } else if (/stato/.test(request) || whitelistIds.includes(request)) {
          log.debug("Stato resource", request, context)
          return callback(null, "commonjs " + request)
        } else {
          log.debug("Checking external", context, request)
        }
        // noinspection JSUnnecessarySemicolon
        ;(callback as any)()
      },
      /electron/,
      "lodash",
      ...ReactExternals,
      ...makeCommonExternals(dir, [/webpack-hot/]) ///react-hot/]
    ],
    []
  )
}

/**
 * Generate all plugin configs
 *
 * @returns {Promise<webpack.Configuration[]>}
 */
async function generatePluginConfigs() {
  return Promise.all(
    Object.values(pluginNameMap).map(plugin => createPluginConfig(plugin))
  )
}

function createAppConfig(): webpack.Configuration {
  const name = "app"
  return makeDefaultConfig(
    name,
    appDir,
    ["./src/index"],
    "node",
    [
      ...ReactExternals,
      /electron/,
      /source-map-support/,
      ...makeCommonExternals(appDir, [...WebpackHotWhitelist, /stato/])
    ],
    [],
    config => ({
      ...config
    })
  )
}

async function createCoreConfig(): Promise<webpack.Configuration> {
  const name = "core"
  return makeDefaultConfig(
    name,
    coreDir,
    ["react-hot-loader/patch", "./src/init"],
    browserTarget,
    [
      /electron/,
      ...makeCommonExternals(coreDir, [
        ...WebpackHotWhitelist,
        ...getWhitelistIds(),
        /stato/
      ])
    ],
    [
      new HtmlWebpackPlugin({
        title: "Stato",
        inject: false,
        template: "./assets/index.pug"
      })
    ],
    config => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          "@stato/common": Path.resolve(packageDir, "common", "src", "index.ts")
        }
      }
    })
  )
}

export default async function generate(
  useMode: Mode = "development",
  usePort: number | undefined = undefined,
  configCustomizer: (
    config: webpack.Configuration
  ) => webpack.Configuration = c => c
): Promise<Array<webpack.Configuration>> {
  if (!isDefined(usePort) && useMode === "development")
    throw new Error("Port must be set in 'development' mode")

  port = usePort
  mode = useMode
  return [
    createAppConfig(),
    await createCoreConfig(),
    ...(await generatePluginConfigs())
  ].map(configCustomizer)
}
