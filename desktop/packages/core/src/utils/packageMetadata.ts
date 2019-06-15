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
import * as electron from "electron"
import * as lodash from "lodash"
import isProduction from "./isProduction"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"

const getPackageJSON = async () => {
  const base =
    isProduction() && electron.remote
      ? electron.remote.app.getAppPath()
      : process.cwd()
  const content: any = await promisify(fs.readFile)(
    path.join(base, "package.json")
  )
  return JSON.parse(content)
}

export const readCurrentRevision: () => Promise<
  string | null | undefined
> = lodash.memoize(async () => {
  // This is provided as part of the bundling process for headless.
  if (global.__REVISION__) {
    return global.__REVISION__
  }

  const json = await getPackageJSON()
  return json.revision
})
