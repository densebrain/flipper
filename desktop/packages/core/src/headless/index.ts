/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as path from "path"
import {createStore} from "redux"
import {applyMiddleware} from "redux"
import * as yargs from "yargs"
import dispatcher from "../dispatcher/index"
import {init as initLogger} from "../fb-stubs/Logger"
import reducers, {Store} from "../reducers/index"
import {exportStore} from "../utils/exportData" // $FlowFixMe this file exist, trust me, flow!

import {setup} from "@stato/init"

yargs
  .usage("$0 [args]")
  .command(
    "*",
    "Start a headless Stato instance",
    yargs => yargs
      .option("secure-port", {
        default: "8088",
        describe: "Secure port the Stato server should run on.",
        type: "string"
      })
      .option("insecure-port", {
        default: "8089",
        describe: "Insecure port the Stato server should run on.",
        type: "string"
      })
      .option("dev", {
        default: false,
        describe: "Enable redux-devtools. Tries to connect to devtools running on port 8181",
        type: "boolean"
      })
      .option("exit", {
        describe: "Controls when to exit and dump the store to stdout.",
        choices: ["sigint", "disconnect"],
        default: "sigint",
        type: "string"
      })
      .option("v", {
        alias: "verbose",
        default: false,
        describe: "Enable verbose logging",
        type: "boolean"
      })
    ,
    (props) => {
      const {v: verbose, exit, "insecure-port": insecurePort, "secure-port": securePort} = props
      console.error(`
   _____ _ _
  |   __| |_|___ ___ ___ ___
  |   __| | | . | . | -_|  _|
  |__|  |_|_|  _|  _|___|_| v${global.__VERSION__}
            |_| |_|
  `) // redirect all logging to stderr
      
      const originalConsole = global.console
      global.console = new Proxy(console, {
        get: function (_obj, prop) {
          return (...args:any[]) => {
            if (prop === "error" || verbose) {
              originalConsole.error(`[${prop as any}] `, ...args)
            }
          }
        }
      }) // Polyfills
      
      Object.assign(global, {
        WebSocket: require("ws"),
        fetch: require("node-fetch/lib/index")
      })
      
      process.env.BUNDLED_PLUGIN_PATH =
        process.env.BUNDLED_PLUGIN_PATH || path.join(path.dirname(process.execPath), "plugins")
      process.env.STATES_PORTS = `${insecurePort},${securePort}` // needs to be required after WebSocket polyfill is loaded
      
      const devToolsEnhancer = require("remote-redux-devtools")
      
      const headlessMiddleware = (store: Store) => (next:any) => (action:any) => {
        if (exit == "disconnect" && action.type == "CLIENT_REMOVED") {
          // TODO(T42325892): Investigate why the export stalls without exiting the
          // current eventloop task here.
          setTimeout(() => {
            exportStore(store)
              .then(({serializedString}) => {
                originalConsole.log(serializedString)
                process.exit()
              })
              .catch(console.error)
          }, 10)
        }
        
        return next(action)
      }
      
      setup({})
      const store = createStore(reducers, devToolsEnhancer.composeWithDevTools(applyMiddleware(headlessMiddleware)))
      const logger = initLogger(store, {
        isHeadless: true
      })
      dispatcher(store, logger)
      
      if (exit == "sigint") {
        process.on("SIGINT", async () => {
          try {
            const {serializedString, errorArray} = await exportStore(store)
            errorArray.forEach(console.error)
            originalConsole.log(serializedString)
          } catch (e) {
            console.error(e)
          }
          
          process.exit()
        })
      }
    }
  )
  .version(global.__VERSION__)
  .help().argv // http://yargs.js.org/docs/#api-argv



