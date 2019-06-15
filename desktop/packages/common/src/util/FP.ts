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
import { Option } from "prelude-ts"
import { isFunction } from "typeguard"

export function toTrueOption(value: boolean | (() => boolean)): Option<true> {
  if (isFunction(value)) value = value()

  return Option.of(value === true ? true : null)
}
