import * as Path from "path"
import {rootDir} from "../dirs"
import createNodeExternals from 'webpack-node-externals'

export const
  ReactExternals = [
    'react',
    'react-dom',
    'react-hot-loader',
    '@hot-loader/react-dom'
  ],
  WebpackHotWhitelist = [
    /hot-loader/,
    /react-hot/,
    /webpack/,
    'react',
    'react-dom',
    /react-hot-loader/,
    /\@hot-loader\/react-dom/
  ],
  DefaultWhitelistExternals =  [
    ...WebpackHotWhitelist
  ],
  makeCommonExternals = (dir: string, whitelist: Array<string | RegExp> = DefaultWhitelistExternals) => [dir,rootDir].map(base => createNodeExternals({
    whitelist,
    modulesDir: Path.resolve(base, 'node_modules')
  }))
