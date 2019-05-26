/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import Server from "../server"
import { init as initLogger } from "../fb-stubs/Logger"
import reducers, {Store} from "../reducers/index"
import { createStore } from "redux"
import * as path from "path"
import * as os from "os"
import * as fs from "fs"
import androidDevice from "../dispatcher/androidDevice"
import iosDevice from "../dispatcher/iOSDevice"
import Client from "../Client"

let server: Server | null = null

const store = createStore(reducers) as Store
beforeAll(() => {
  // create config directory, which is usually created by static/index.js
  const statesDir = path.join(os.homedir(), ".states")

  if (!fs.existsSync(statesDir)) {
    fs.mkdirSync(statesDir)
  }

  const logger = initLogger(store)
  androidDevice(store, logger)
  iosDevice(store, logger)
  server = new Server(logger, store)
  return server.init()
})
test("Device can connect successfully", done => {
  let testFinished = false
  let disconnectedTooEarly = false
  const registeredClients:Array<Client> = []
  server.addListener("new-client", (client: Client) => {
    // Check there is a connected device that has the same device_id as the new client
    const deviceId = client.query.device_id
    expect(deviceId).toBeTruthy()
    const devices = store.getState().connections.devices
    expect(devices.map(device => device.serial)).toContain(deviceId) // Make sure it only connects once

    registeredClients.push(client)
    expect(registeredClients).toHaveLength(1) // Make sure client stays connected for some time before passing test

    setTimeout(() => {
      testFinished = true
      expect(disconnectedTooEarly).toBe(false)
      done()
    }, 5000)
  })
  server.addListener("removed-client", (_id: string) => {
    if (!testFinished) {
      disconnectedTooEarly = true
    }
  })
}, 20000)
afterAll(() => {
  return server.close()
})
