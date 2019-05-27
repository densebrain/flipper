/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {isMac} from "@stato/common"

import * as fs from "fs"

import * as path from "path"

import {promisify} from "util"

import { spawn } from "child_process"

const readFileAsync = promisify(fs.readFile)

const xdg = require("xdg-basedir")

const mkdirp = require("mkdirp")

const isProduction = () => !/node_modules[\\/]electron[\\/]/.test(process.execPath)

const isLauncherInstalled = () => {
  if (isMac()) {
    const receipt = "com.facebook.states.launcher"
    const plistLocation = "/Applications/States.app/Contents/Info.plist"
    return fs.existsSync(plistLocation) && fs.readFileSync(plistLocation).indexOf(receipt) > 0
  }

  return false
}

const startLauncher = (argv:StatoOptions) => {
  const args = []

  if (argv.file) {
    args.push("--file", argv.file)
  }

  if (argv.url) {
    args.push("--url", argv.url)
  }

  if (isMac()) {
    spawn("open", ["/Applications/States.app", "--args"].concat(args))
  }
}

const checkIsCycle = async () => {
  const dir = path.join(xdg.cache, "stato")
  const filePath = path.join(dir, "last-launcher-run") // This isn't monotonically increasing, so there's a change we get time drift
  // between the checks, but the worst case here is that we do two roundtrips
  // before this check works.

  const rightNow = Date.now()
  let backThen

  try {
    backThen = parseInt(await readFileAsync(filePath,'utf-8'), 10)
  } catch (e) {
    backThen = 0
  }

  const delta = rightNow - backThen
  await promisify(mkdirp)(dir)
  await promisify(fs.writeFile)(filePath, rightNow) // If the last startup was less than 5s ago, something's not okay.

  return Math.abs(delta) < 5000
}
/**
 * Runs the launcher if required and returns a boolean based on whether
 * it has. You should shut down this instance of the app in that case.
 */

export default async function delegateToLauncher(argv:StatoOptions) {
  if (argv.launcher && isProduction() && isLauncherInstalled()) {
    if (await checkIsCycle()) {
      console.error("Launcher cycle detected. Not delegating even though I usually would.")
      return false
    }

    console.warn("Delegating to Stato Launcher ...")
    console.warn(`You can disable this behavior by passing '--no-launcher' at startup.`)
    startLauncher(argv)
    return true
  }

  return false
}
