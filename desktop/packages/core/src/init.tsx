/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
//import "source-map-support/register"

import "react-hot-loader"
import "./react-hot-config"
import "./GlobalTypes"

import * as ReactDOM from "react-dom"

import {getLogger} from "@states/common"
import {Provider} from "react-redux"
import * as React from "react"

import GK from "./fb-stubs/GK"
import {init as initLogger} from "./fb-stubs/Logger"
import App from "./App"
import BugReporter from "./fb-stubs/BugReporter"
import {createStore} from "redux"
import {persistStore} from "redux-persist"
import reducers from "./reducers/index"
import dispatcher from "./dispatcher/index"
import {TooltipProviderStyled as TooltipProvider} from "./ui/components/TooltipProvider"
import config from "./utils/processConfig"
import {initLauncherHooks} from "./utils/launcher"
import ContextMenuProvider from "./ui/components/ContextMenuProvider"

// const path = require("path")

const
  log = getLogger(__filename),
  store = createStore(
    reducers,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
Object.assign(global,{
  //webpackInitRequire: require,
  webpackRequire: __webpack_require__,
  webpackModules: __webpack_modules__,
  statesStore: store,
  "isDev": isDev,
  "__non_webpack_require__": __non_webpack_require__
})

async function init() {
persistStore(store)
const
  logger = initLogger(store),
  bugReporter = new BugReporter(logger, store)
  
await dispatcher(store, logger)
GK.init()

const AppFrame = (): React.ReactElement => (
  <TooltipProvider options={{}}>
    <ContextMenuProvider>
      <Provider store={store}>
        <App logger={logger} store={store} bugReporter={bugReporter} />
      </Provider>
    </ContextMenuProvider>
  </TooltipProvider>
)

  ReactDOM.render(<AppFrame />, document.getElementById("root")) // $FlowFixMe: service workers exist!

  // ;(navigator as any).serviceWorker
  //   .register(process.env.NODE_ENV === "production" ? path.join(__dirname, "serviceWorker") : "./serviceWorker")
  //   .then((r:any) => {
  //     const worker = r.installing || r.active
  //     if (worker) {
  //       worker.postMessage({
  //         precachedIcons
  //       })
  //     }
  //   })
  //   .catch(console.error)
  initLauncherHooks(config(), store)
}

window.addEventListener("load", () => {
  console.info("loaded")
  init()
})

if (module.hot) {
  module.hot.addStatusHandler(status => {
    log.info(`HMR: Status Changed: ${status}`)
    if (['abort','fail'].includes(status)) {
      window.location.reload()
    }
  })
}

export {}
