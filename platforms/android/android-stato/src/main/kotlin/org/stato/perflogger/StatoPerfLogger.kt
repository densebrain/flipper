/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.perflogger

interface StatoPerfLogger {

  fun startMarker(name: String)

  fun endMarker(name: String)

  fun cancelMarker(name: String)
}
