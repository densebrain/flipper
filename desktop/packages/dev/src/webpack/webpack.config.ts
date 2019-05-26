import {getLogger, Identity} from "@states/common"
import * as Path from "path"
import {isDefined} from "typeguard"
import {coreDir, packageDir, appDir, rootDir, pluginNames, pluginNameMap, PluginConfig} from "../dirs"
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



const
  log = getLogger(__filename),
  browserTarget = "node" // "electron-renderer"
  

let mode: Mode = "development"
let port: number | undefined = 3000

const
  devTools: { [mode in Mode]: webpack.Options.Devtool } = {
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


/**
 * Generate all plugin configs
 *
 * @returns {Promise<webpack.Configuration[]>}
 */
async function generatePluginConfigs() {
  return Promise.all(
    Object.values(pluginNameMap)
      .map(plugin => createPluginConfig(plugin))
  )
}

function makeDefaultConfig(
  name: string,
  context: string,
  entry: string[],
  target: "node" | "electron-renderer",
  externals: ExternalsElement | ExternalsElement[],
  plugins: webpack.Plugin[],
  customizer: (config: webpack.Configuration) => webpack.Configuration | undefined = Identity
) {
  return customizer(applyMode(name, {
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
      ignored: [/node_modules.*(src|states)/]
    },
    node: nodeConfig,

    plugins: [
      new webpack.DefinePlugin({
        "process.env.PluginModuleWhitelist": JSON.stringify(getWhitelistIds()),
        isDev: JSON.stringify(mode === "development"),
        ...(mode !== "production" ? {} : {
          "process.env.BundledPluginNames": JSON.stringify(pluginNames)
        })
      }),
      new IgnoreNotFoundExportPlugin(),
      new ForkTsCheckerPlugin(),
      ...plugins
    ]
  }))
}

function createAppConfig(): webpack.Configuration {
  const name = "app"
  return makeDefaultConfig(
    name,
    appDir,
    ["./src/index"],
    "node",
    [
      // /^\@states/,
      ...ReactExternals,
      /electron/,
      /source-map-support/,
      ...makeCommonExternals(appDir, [...WebpackHotWhitelist, /states/])
    ],
    [],
    config => ({
      ...config
    })
  )
}

function getWhitelistIds() {
  return ['react',
    'react-dom',
    'react-hot-loader',
    '@hot-loader/react-dom',
  
    '@material-ui/styles/ThemeContext',
    '@material-ui/styles/withStyles',
    '@material-ui/styles',
    '@material-ui/core',
    '@material-ui/core/styles/colorManipulator',
    '@material-ui/styles/jssPreset',
    '@material-ui/utils',
    'jss']
}

async function createCoreConfig(): Promise<webpack.Configuration> {
  const name = "core"
  return makeDefaultConfig(
    name,
    coreDir,
    ["react-hot-loader/patch", "./src/init"],
    browserTarget,
    [
      // /^\@states/,
      /electron/,
      ...makeCommonExternals(coreDir, [...WebpackHotWhitelist, ...(getWhitelistIds()),/states/])
    ],
    [
      new HtmlWebpackPlugin({
        title: "States",
        inject: false,
        template: "./assets/index.pug"
      })
    ], config => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          "@states/common": Path.resolve(packageDir, "common","src","index.ts"),
        }
      }
    })
    
  )
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

/**
 * Create plugin config
 *
 *
 * @returns {Promise<webpack.Configuration>}
 * @param pluginConfig
 */
async function createPluginConfig(pluginConfig: PluginConfig): Promise<webpack.Configuration> {
  const
    {
      name,
      dir
    } = pluginConfig,
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
          log.debug("States plugin request, ignoring", request, context)
        } else if (/states/.test(request) || whitelistIds.includes(request)) {
          log.debug(`States resource`, request, context)
          return callback(null, "commonjs " + request)
        } else {
          log.debug(`Checking external`, context, request)
        }
        (callback as any)()
      },
      /electron/,
      "lodash",
      ...ReactExternals,
      ...makeCommonExternals(dir, [/webpack-hot/])///react-hot/]
    ],
    []
    
  )
}

export default async function generate(
  useMode: Mode = "development",
  usePort: number | undefined = undefined,
  configCustomizer: ((config: webpack.Configuration) => webpack.Configuration)  = (c) => c
): Promise<Array<webpack.Configuration>> {
  if (!isDefined(usePort) && useMode === "development")
    throw new Error("Port must be set in 'development' mode")
  
  port = usePort
  mode = useMode
  return [createAppConfig(), await createCoreConfig(), ...(await generatePluginConfigs())]
    .map(configCustomizer)
}
