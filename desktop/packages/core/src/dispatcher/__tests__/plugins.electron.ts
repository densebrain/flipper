/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
//checkGK
import dispatcher, { getDynamicPlugins, checkDisabled, makeRequirePlugin } from "../PluginDispatcher"
import path from "path"
import { remote } from "electron"
import {StatoPluginComponent } from "../../plugin"
import reducers from "../../reducers/index"
import { init as initLogger } from "../../fb-stubs/Logger"
import TestPlugin from "./TestPlugin"

const configureStore = require("redux-mock-store").default
//import { TEST_PASSING_GK, TEST_FAILING_GK } from "../../fb-stubs/GK"

//import {Plugin} from "../../PluginTypes"
const mockStore = configureStore([])(
  reducers(undefined, {
    type: "INIT"
  })
)
const logger = initLogger(mockStore)
test("dispatcher dispatches REGISTER_PLUGINS", () => {
  dispatcher(mockStore, logger)
  const actions = mockStore.getActions()
  expect(actions.map((a:any) => a.type)).toContain("REGISTER_PLUGINS")
})
test("getDynamicPlugins returns empty array", () => {
  // $FlowFixMe process.env not defined in electron API spec
  remote.process.env.PLUGINS = null
  const res = getDynamicPlugins()
  expect(res).toEqual([])
})
test("getDynamicPlugins returns empty array for invalid JSON", () => {
  // $FlowFixMe process.env not defined in electron API spec
  remote.process.env.PLUGINS = "invalid JOSN }}[]"
  const res = getDynamicPlugins()
  expect(res).toEqual([])
})
test("getDynamicPlugins from env", () => {
  const plugins = [
    {
      name: "test"
    }
  ] // $FlowFixMe process.env not defined in electron API spec

  remote.process.env.PLUGINS = JSON.stringify(plugins)
  const res = getDynamicPlugins()
  expect(res).toEqual(plugins)
})
test("checkDisabled", () => {
  const disabledPlugin = "pluginName"
  const config = {
    disabledPlugins: [disabledPlugin]
  } // $FlowFixMe process.env not defined in electron API spec

  remote.process.env.CONFIG = JSON.stringify(config)
  const disabled = checkDisabled([])
  expect(
    disabled({
      id: "other Name",
      path: "./test/index"
    })
  ).toBeTruthy()
  expect(
    disabled({
      id: disabledPlugin,
      path: "./test/index"
    })
  ).toBeFalsy()
})
// test("checkGK for plugin without GK", () => {
//   expect(
//     checkGK([])({
//       name: "pluginID",
//       path: "./test/index"
//     })
//   ).toBeTruthy()
// })
// test("checkGK for passing plugin", () => {
//   expect(
//     checkGK([])({
//       name: "pluginID",
//       gatekeeper: TEST_PASSING_GK,
//       path: "./test/index"
//     })
//   ).toBeTruthy()
// })
// test("checkGK for failing plugin", () => {
//   const gatekeepedPlugins:Array<Plugin> = []
//   const name = "pluginID"
//   const plugins = checkGK(gatekeepedPlugins)({
//     name,
//     gatekeeper: TEST_FAILING_GK,
//     path: "./test/index"
//   })
//   expect(plugins).toBeFalsy()
//   expect(gatekeepedPlugins[0].name).toEqual(name)
// })
test("makeRequirePlugin returns null for invalid requires", () => {
  const plugin = makeRequirePlugin([])({
    id: "pluginID",
    path: "this/path/does not/exist"
  })
  expect(plugin).toBeNull()
})
test("makeRequirePlugin loads plugin", async () => {
  const id = "pluginID"
  const url = "https://fb.workplace.com/groups/230455004101832/"
  const plugin = await makeRequirePlugin([])({
    id,
    //url,
    path: path.join(__dirname, "TestPlugin")
  }) // $FlowFixMe

  expect(plugin.componentClazz.prototype).toBeInstanceOf(StatoPluginComponent) // $FlowFixMe

  expect(plugin.url).toBe(url) // $FlowFixMe

  expect(plugin.id).toBe(TestPlugin.id)
})
