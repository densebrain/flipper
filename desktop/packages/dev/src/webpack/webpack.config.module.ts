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

import * as webpack from "webpack"

const moduleConfig = {
  rules: [
    {
      test: /\.pug?$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: "pug-loader"
      }
    },
    {
      test: /\.(svg|png|gif|jpg|woff|woff2|ttf|otf)$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: "file-loader"
      }
    },
    {
      test: /\.(sass|scss|css)$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: "style-loader!css-loader!sass-loader"
      }
    },
    {
      test: /\.([jt])sx?$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          babelrc: false,
          presets: [
            [
              "@babel/preset-env",
              { targets: { electron: "5.0.1" } } // or whatever your project requires
            ],
            "@babel/preset-typescript",
            "@babel/preset-react"
          ],
          plugins: [
            // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
            ["@babel/plugin-syntax-dynamic-import"],
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
            "react-hot-loader/babel"
          ]
        }
      }
    }
  ]
} as webpack.Module

export default moduleConfig
