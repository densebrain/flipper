/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

export type StatesServerPorts = {
    insecure: number,
    secure: number
  }
  | null
  | undefined

export function parseStatesPorts(
  envVar: string
): StatesServerPorts {
  const components = envVar.split(",")
  const ports = components.map(x => parseInt(x, 10)) // Malformed numbers will get parsed to NaN which is not > 0

  if (ports.length === 2 && components.every(x => /^[0-9]+$/.test(x)) && ports.every(x => x > 0)) {
    return {
      insecure: ports[0],
      secure: ports[1]
    }
  }
}
