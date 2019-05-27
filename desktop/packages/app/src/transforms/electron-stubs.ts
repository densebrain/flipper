/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as Path from "path"

const babylon = require("@babel/parser")

const fs = require("fs")

const electronStubs = babylon.parseExpression(fs.readFileSync(Path.resolve(__dirname,"..","..","static", "electron-stubs.notjs").toString()))

export default function() {
  return {
    name: "replace-electron-requires-with-stubs",
    visitor: {
      CallExpression(path: any) {
        if (
          path.node.type === "CallExpression" &&
          path.node.callee.type === "Identifier" &&
          path.node.callee.name === "require" &&
          path.node.arguments.length > 0
        ) {
          if (path.node.arguments[0].value === "electron") {
            path.replaceWith(electronStubs)
          }
        }
      }
    }
  }
}